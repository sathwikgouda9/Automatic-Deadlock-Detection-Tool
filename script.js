document.addEventListener('DOMContentLoaded', function() {
    
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    const staticGraph = document.getElementById('static-graph');
    renderStaticGraph(staticGraph);
    
    const interactiveGraph = document.getElementById('interactive-graph');
    const detectionResult = document.getElementById('detection-result');
    let nodes = [];
    let edges = [];
    let selectedNode = null;
    let isCreatingEdge = false;
    
    document.getElementById('add-process').addEventListener('click', function() {
        const nodeId = 'P' + (nodes.filter(n => n.type === 'process').length + 1);
        const node = {
            id: nodeId,
            type: 'process',
            x: Math.random() * (interactiveGraph.offsetWidth - 60),
            y: Math.random() * (interactiveGraph.offsetHeight - 60)
        };
        nodes.push(node);
        renderInteractiveGraph();
    });
    
    document.getElementById('add-resource').addEventListener('click', function() {
        const nodeId = 'R' + (nodes.filter(n => n.type === 'resource').length + 1);
        const node = {
            id: nodeId,
            type: 'resource',
            x: Math.random() * (interactiveGraph.offsetWidth - 60),
            y: Math.random() * (interactiveGraph.offsetHeight - 60)
        };
        nodes.push(node);
        renderInteractiveGraph();
    });
    
    document.getElementById('create-edge').addEventListener('click', function() {
        isCreatingEdge = !isCreatingEdge;
        this.classList.toggle('btn-light');
        this.classList.toggle('btn');
        
        if (!isCreatingEdge) {
            selectedNode = null;
            renderInteractiveGraph();
        }
    });
    document.getElementById('detect-deadlock').addEventListener('click', function() {
        const hasDeadlock = checkForDeadlock();
        
        detectionResult.style.display = 'block';
        if (hasDeadlock) {
            detectionResult.className = 'detection-result deadlock-detected';
            detectionResult.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Deadlock Detected! System has a circular wait condition.';
        } else {
            detectionResult.className = 'detection-result no-deadlock';
            detectionResult.innerHTML = '<i class="fas fa-check-circle"></i> No Deadlock Detected. System is operating normally.';
        }
        
        if (hasDeadlock) {
            this.classList.add('shake');
            setTimeout(() => {
                this.classList.remove('shake');
            }, 500);
        }
    });
    
    document.getElementById('reset-graph').addEventListener('click', function() {
        nodes = [];
        edges = [];
        selectedNode = null;
        isCreatingEdge = false;
        detectionResult.style.display = 'none';
        document.getElementById('create-edge').classList.remove('btn');
        document.getElementById('create-edge').classList.add('btn-light');
        renderInteractiveGraph();
    });
    
    interactiveGraph.addEventListener('click', function(e) {
        if (!isCreatingEdge) return;
        
        const clickedNode = e.target.closest('.node');
        if (!clickedNode) return;
        
        const nodeId = clickedNode.getAttribute('data-id');
        const node = nodes.find(n => n.id === nodeId);
        
        if (!selectedNode) {
            selectedNode = node;
            clickedNode.classList.add('pulse');
        } else if (selectedNode.id === nodeId) {
            selectedNode = null;
            clickedNode.classList.remove('pulse');
        } else {
            edges.push({
                from: selectedNode.id,
                to: node.id
            });
            
            document.querySelectorAll('.node').forEach(n => n.classList.remove('pulse'));
            selectedNode = null;
            renderInteractiveGraph();
        }
    });
    
    interactiveGraph.addEventListener('mousedown', function(e) {
        const nodeElement = e.target.closest('.node');
        if (!nodeElement || isCreatingEdge) return;
        
        const nodeId = nodeElement.getAttribute('data-id');
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        let startX = e.clientX;
        let startY = e.clientY;
        let startNodeX = node.x;
        let startNodeY = node.y;
        
        function moveNode(e) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            node.x = startNodeX + dx;
            node.y = startNodeY + dy;
            
            renderInteractiveGraph();
        }
        
        function stopDrag() {
            document.removeEventListener('mousemove', moveNode);
            document.removeEventListener('mouseup', stopDrag);
        }
        
        document.addEventListener('mousemove', moveNode);
        document.addEventListener('mouseup', stopDrag);
    });
    
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        
        alert(`Thank you, ${name}! We've received your message and will contact you at ${email} shortly.`);
        this.reset();
    });
    function renderStaticGraph(container) {
        container.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
                <!-- Processes -->
                <circle cx="200" cy="100" r="40" fill="#3498db" />
                <text x="200" y="105" font-size="16" fill="white" text-anchor="middle" font-weight="bold">P1</text>
                
                <circle cx="200" cy="300" r="40" fill="#3498db" />
                <text x="200" y="305" font-size="16" fill="white" text-anchor="middle" font-weight="bold">P2</text>
                
                <!-- Resources -->
                <rect x="400" y="50" width="80" height="80" rx="10" fill="#e74c3c" />
                <text x="440" y="95" font-size="16" fill="white" text-anchor="middle" font-weight="bold">R1</text>
                
                <rect x="400" y="250" width="80" height="80" rx="10" fill="#e74c3c" />
                <text x="440" y="295" font-size="16" fill="white" text-anchor="middle" font-weight="bold">R2</text>
                
                <!-- Edges showing wait-for relationships -->
                <!-- P1 -> R1 -->
                <line x1="240" y1="100" x2="400" y2="90" stroke="#2c3e50" stroke-width="3" />
                <polygon points="400,90 390,85 390,95" fill="#2c3e50" />
                
                <!-- P2 -> R2 -->
                <line x1="240" y1="300" x2="400" y2="290" stroke="#2c3e50" stroke-width="3" />
                <polygon points="400,290 390,285 390,295" fill="#2c3e50" />
                
                <!-- R1 -> P2 (P1 holds R1, P2 waits) -->
                <line x1="400" y1="130" x2="240" y2="270" stroke="#2c3e50" stroke-width="3" stroke-dasharray="5,5" />
                <polygon points="240,270 250,265 250,275" fill="#2c3e50" />
                
                <!-- R2 -> P1 (P2 holds R2, P1 waits) -->
                <line x1="400" y1="330" x2="240" y2="130" stroke="#2c3e50" stroke-width="3" stroke-dasharray="5,5" />
                <polygon points="240,130 250,125 250,135" fill="#2c3e50" />
                
                <!-- Legend -->
                <rect x="550" y="50" width="200" height="120" fill="white" stroke="#ddd" rx="5" />
                <text x="560" y="80" font-size="14">Process: <circle cx="650" cy="73" r="8" fill="#3498db" /></text>
                <text x="560" y="105" font-size="14">Resource: <rect x="645" y="95" width="16" height="16" rx="3" fill="#e74c3c" /></text>
                <text x="560" y="130" font-size="14">Holds: <line x1="645" y1="125" x2="665" y2="125" stroke="#2c3e50" stroke-width="2" /></text>
                <text x="560" y="155" font-size="14">Waits: <line x1="645" y1="150" x2="665" y2="150" stroke="#2c3e50" stroke-width="2" stroke-dasharray="3,3" /></text>
                
                <!-- Deadlock indicator -->
                <text x="400" y="200" font-size="20" fill="#e74c3c" text-anchor="middle" font-weight="bold">Deadlock Detected (Cycle: P1 → R1 → P2 → R2 → P1)</text>
            </svg>
        `;
    }
    
    function renderInteractiveGraph() {
        interactiveGraph.innerHTML = '';
        
        edges.forEach(edge => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            
            if (fromNode && toNode) {
                const edgeElement = document.createElement('div');
                edgeElement.className = 'edge';
                
                const dx = toNode.x - fromNode.x;
                const dy = toNode.y - fromNode.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                
                edgeElement.style.width = `${length}px`;
                edgeElement.style.left = `${fromNode.x + 30}px`;
                edgeElement.style.top = `${fromNode.y + 30}px`;
                edgeElement.style.transform = `rotate(${angle}deg)`;
                const arrow = document.createElement('div');
                arrow.className = 'arrow';
                arrow.style.left = `${length - 8}px`;
                arrow.style.top = '-5px';
                arrow.style.borderWidth = '5px 0 5px 10px';
                arrow.style.borderColor = `transparent transparent transparent var(--dark)`;
                
                edgeElement.appendChild(arrow);
                interactiveGraph.appendChild(edgeElement);
            }
        });
        
        nodes.forEach(node => {
            const nodeElement = document.createElement('div');
            nodeElement.className = `node ${node.type}`;
            nodeElement.setAttribute('data-id', node.id);
            nodeElement.textContent = node.id;
            nodeElement.style.left = `${node.x}px`;
            nodeElement.style.top = `${node.y}px`;
            
            if (selectedNode && selectedNode.id === node.id) {
                nodeElement.classList.add('pulse');
            }
            
            interactiveGraph.appendChild(nodeElement);
        });
    }
    
    function checkForDeadlock() {
        const adj = {};
        nodes.forEach(node => {
            adj[node.id] = [];
        });
        
        edges.forEach(edge => {
            adj[edge.from].push(edge.to);
        });
        
        const visited = {};
        const recursionStack = {};
        
        function isCyclicUtil(nodeId) {
            if (!visited[nodeId]) {
                visited[nodeId] = true;
                recursionStack[nodeId] = true;
                
                for (const neighbor of adj[nodeId] || []) {
                    if (!visited[neighbor] && isCyclicUtil(neighbor)) {
                        return true;
                    } else if (recursionStack[neighbor]) {
                        return true;
                    }
                }
            }
            
            recursionStack[nodeId] = false;
            return false;
        }
        
        for (const node of nodes) {
            if (isCyclicUtil(node.id)) {
                return true;
            }
        }
        
        return false;
    }
});
