// Custom SSE (Server-Sent Events) support for Swagger UI
(function() {
    console.log('[SSE Support] Script loaded');

    // Wait for Swagger UI to fully load
    const initSSESupport = () => {
        if (!window.ui) {
            setTimeout(initSSESupport, 100);
            return;
        }

        console.log('[SSE Support] Swagger UI detected, initializing...');

        // Monitor for new operation blocks being added
        const observer = new MutationObserver(() => {
            patchExecuteButtons();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Initial patch
        setTimeout(patchExecuteButtons, 1000);
    };

    function patchExecuteButtons() {
        document.querySelectorAll('.opblock').forEach(opblock => {
            // Check if this endpoint produces text/event-stream
            const mediaTypeSelects = opblock.querySelectorAll('.content-type select option');
            let isSSE = false;

            mediaTypeSelects.forEach(option => {
                if (option.value === 'text/event-stream' || option.textContent.includes('text/event-stream')) {
                    isSSE = true;
                }
            });

            // Also check in the response content types
            const responseTables = opblock.querySelectorAll('.responses-table, .response-col_description');
            responseTables.forEach(table => {
                if (table.textContent.includes('text/event-stream')) {
                    isSSE = true;
                }
            });

            if (!isSSE) return;

            console.log('[SSE Support] SSE endpoint detected:', opblock.querySelector('.opblock-summary-path')?.textContent);

            const executeBtn = opblock.querySelector('.btn.execute');
            if (!executeBtn || executeBtn.dataset.ssePatched) return;

            executeBtn.dataset.ssePatched = 'true';

            // Remove existing listeners and add our custom one
            const newExecuteBtn = executeBtn.cloneNode(true);
            executeBtn.parentNode.replaceChild(newExecuteBtn, executeBtn);

            newExecuteBtn.addEventListener('click', (e) => handleExecuteClick(e, opblock), true);
            console.log('[SSE Support] Patched execute button');
        });
    }

    function handleExecuteClick(e, opblock) {
        e.stopPropagation();
        e.preventDefault();

        console.log('[SSE Support] Execute clicked for SSE endpoint');

        // Get the request URL from the path
        const pathElement = opblock.querySelector('.opblock-summary-path span, .opblock-summary-path a');
        if (!pathElement) {
            console.error('[SSE Support] Could not find path element');
            return;
        }

        const path = pathElement.textContent.trim();
        const method = opblock.querySelector('.opblock-summary-method')?.textContent.trim().toUpperCase();

        console.log('[SSE Support] Path:', path, 'Method:', method);

        if (method !== 'GET') {
            alert('SSE only works with GET requests');
            return;
        }

        // Find or create response section
        let responseSection = opblock.querySelector('.responses-wrapper');
        if (!responseSection) {
            responseSection = opblock.querySelector('.execute-wrapper');
        }

        if (!responseSection) {
            console.error('[SSE Support] Could not find response section');
            return;
        }

        // Clear previous SSE responses
        const existingResponse = responseSection.querySelector('.sse-response');
        if (existingResponse) {
            existingResponse.remove();
        }

        // Create response display
        const responseDiv = document.createElement('div');
        responseDiv.className = 'sse-response';
        responseDiv.style.cssText = 'margin-top: 20px; padding: 15px; background: #f7f7f7; border: 1px solid #ccc; border-radius: 4px; font-family: monospace;';

        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #ddd;';
        headerDiv.innerHTML = `
            <strong style="color: #2c3e50; font-size: 14px;">🔴 Server-Sent Events Stream</strong>
            <button class="sse-close-btn" style="float: right; padding: 5px 12px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">Close Connection</button>
            <div style="clear: both; margin-top: 8px; color: #7f8c8d; font-size: 13px;">
                Status: <span class="sse-status" style="font-weight: bold;">Connecting...</span> |
                Events: <span class="sse-count">0</span>
            </div>
        `;

        const eventsDiv = document.createElement('div');
        eventsDiv.className = 'sse-events';
        eventsDiv.style.cssText = 'max-height: 500px; overflow-y: auto; background: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd;';

        responseDiv.appendChild(headerDiv);
        responseDiv.appendChild(eventsDiv);

        responseSection.appendChild(responseDiv);

        // Construct full URL
        const baseUrl = window.location.origin;
        const fullUrl = baseUrl + path;

        console.log('[SSE Support] Connecting to:', fullUrl);

        // Setup EventSource
        const eventSource = new EventSource(fullUrl);
        let eventCount = 0;

        const statusSpan = headerDiv.querySelector('.sse-status');
        const countSpan = headerDiv.querySelector('.sse-count');
        const closeBtn = headerDiv.querySelector('.sse-close-btn');

        eventSource.onopen = () => {
            console.log('[SSE Support] Connection opened');
            statusSpan.textContent = 'Connected ✓';
            statusSpan.style.color = '#27ae60';
            addEvent('info', 'Connection established to ' + fullUrl, eventsDiv);
        };

        eventSource.onmessage = (event) => {
            console.log('[SSE Support] Message received:', event.data);
            eventCount++;
            countSpan.textContent = eventCount;
            addEvent('message', event.data, eventsDiv, eventCount);
        };

        eventSource.onerror = (error) => {
            console.error('[SSE Support] Error:', error);
            statusSpan.textContent = 'Error/Closed ✗';
            statusSpan.style.color = '#e74c3c';
            addEvent('error', 'Connection error or closed by server', eventsDiv);
            setTimeout(() => eventSource.close(), 1000);
        };

        // Handle custom event type "new-order"
        eventSource.addEventListener('new-order', (event) => {
            console.log('[SSE Support] new-order event received:', event.data);
            eventCount++;
            countSpan.textContent = eventCount;
            addEvent('new-order', event.data, eventsDiv, eventCount);
        });

        closeBtn.onclick = () => {
            console.log('[SSE Support] Connection closed by user');
            eventSource.close();
            statusSpan.textContent = 'Closed by user';
            statusSpan.style.color = '#95a5a6';
            addEvent('info', 'Connection closed by user', eventsDiv);
            closeBtn.disabled = true;
            closeBtn.style.background = '#95a5a6';
            closeBtn.style.cursor = 'not-allowed';
        };
    }

    function addEvent(type, data, container, eventNum) {
        const eventDiv = document.createElement('div');
        eventDiv.style.cssText = 'margin: 8px 0; padding: 10px; background: ' + getBgColorForType(type) + '; border-left: 4px solid ' + getColorForType(type) + '; border-radius: 3px;';

        const timestamp = new Date().toLocaleTimeString();
        const eventLabel = eventNum ? `Event #${eventNum}` : type.toUpperCase();

        eventDiv.innerHTML = `
            <div style="color: ${getColorForType(type)}; font-weight: bold; margin-bottom: 5px; font-size: 12px;">
                [${timestamp}] ${eventLabel}${type !== 'message' && type !== 'info' ? ` (${type})` : ''}
            </div>
            <div style="color: #2c3e50; white-space: pre-wrap; word-break: break-word; font-size: 13px;">${escapeHtml(data)}</div>
        `;

        container.appendChild(eventDiv);
        container.scrollTop = container.scrollHeight;
    }

    function getColorForType(type) {
        switch(type) {
            case 'error': return '#e74c3c';
            case 'info': return '#3498db';
            case 'new-order': return '#f39c12';
            case 'message': return '#27ae60';
            default: return '#95a5a6';
        }
    }

    function getBgColorForType(type) {
        switch(type) {
            case 'error': return '#fadbd8';
            case 'info': return '#d6eaf8';
            case 'new-order': return '#fdebd0';
            case 'message': return '#d5f4e6';
            default: return '#f4f4f4';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSSESupport);
    } else {
        initSSESupport();
    }
})();
