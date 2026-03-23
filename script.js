/**
 * Corrida Sustentável - Jogo de Tabuleiro Digital
 * Por: Antigravity AI (Simulando projeto de aluno de I.A.)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Game Constants
    const TOTAL_HOUSES = 28; // Start (0), Houses (1-26), End (27)
    const START_CREDITS = 5;
    const PLAYERS_DATA = [
        { id: 1, name: "Guardião da Natureza", icon: "🌱", color: "#2ecc71", theme: "verde" },
        { id: 2, name: "Energia Limpa", icon: "☀️", color: "#f1c40f", theme: "amarelo" },
        { id: 3, name: "Protetor da Água", icon: "💧", color: "#3498db", theme: "azul" },
        { id: 4, name: "Reciclador", icon: "♻️", color: "#e67e22", theme: "laranja" }
    ];

    // Game State
    let players = [];
    let currentPlayerIndex = 0;
    let board = [];
    let isGameOver = false;
    let isMoving = false;
    let autoMode = false;

    // DOM Elements
    const boardEl = document.getElementById('board');
    const playerStatsEl = document.getElementById('player-stats');
    const diceEl = document.getElementById('dice');
    const rollBtn = document.getElementById('roll-btn');
    const autoBtn = document.getElementById('auto-btn');
    const logContent = document.getElementById('log-content');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalOptions = document.getElementById('modal-options');
    const modalClose = document.getElementById('modal-close');

    // Initialization
    function init() {
        createBoard();
        createPlayers();
        renderPlayers();
        updateStats();
        addLog("Jogo inicializado. Boa sorte aos competidores!");
    }

    function createBoard() {
        // Shuffle types for inner 26 houses
        const types = [];
        for (let i = 0; i < 9; i++) types.push('green');
        for (let i = 0; i < 9; i++) types.push('red');
        for (let i = 0; i < 8; i++) types.push('gray');
        
        // Fisher-Yates shuffle
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }

        // Add start and end
        board = [{ type: 'start', icon: '🏁' }];
        for (let i = 0; i < 26; i++) {
            const type = types[i];
            let icon = '';
            if (type === 'green') icon = '🌱';
            if (type === 'red') icon = '🏭';
            if (type === 'gray') icon = '❓';
            board.push({ type, icon });
        }
        board.push({ type: 'end', icon: '🏆' });

        // Render board
        boardEl.innerHTML = '';
        board.forEach((house, index) => {
            const houseEl = document.createElement('div');
            houseEl.className = `house ${house.type}`;
            houseEl.id = `house-${index}`;
            houseEl.innerHTML = `
                <span class="house-number">${index === 0 ? 'INÍCIO' : index === 27 ? 'FIM' : index}</span>
                <div class="house-icon">${house.icon}</div>
                <div class="players-on-house"></div>
            `;
            boardEl.appendChild(houseEl);
        });
    }

    function createPlayers() {
        players = PLAYERS_DATA.map(p => ({
            ...p,
            position: 0,
            credits: START_CREDITS,
            skipNextTurn: false,
            rank: 0,
            finished: false,
            isAI: false 
        }));
    }

    function renderPlayers() {
        // Clear all house containers
        document.querySelectorAll('.players-on-house').forEach(container => {
            container.innerHTML = '';
        });

        players.forEach(player => {
            if (player.finished && player.position >= 27) return; // Don't show if finished

            const houseContainer = document.querySelector(`#house-${player.position} .players-on-house`);
            if (houseContainer) {
                const token = document.createElement('div');
                token.className = 'p-token';
                token.style.backgroundColor = player.color;
                token.innerHTML = `<span style="font-size: 0.6rem; display: flex; align-items: center; justify-content: center; height: 100%;">${player.icon}</span>`;
                token.title = player.name;
                houseContainer.appendChild(token);
            }
        });
    }

    function updateStats() {
        playerStatsEl.innerHTML = '';
        players.forEach((player, index) => {
            const card = document.createElement('div');
            card.className = `player-card ${index === currentPlayerIndex ? 'active' : ''} ${player.finished ? 'finished' : ''}`;
            card.innerHTML = `
                <div class="player-dot" style="background-color: ${player.color}"></div>
                <div class="player-info">
                    <div>${player.name}</div>
                    <div class="player-credits">${player.credits} Créditos</div>
                </div>
            `;
            playerStatsEl.appendChild(card);
        });
    }

    function addLog(message, type = 'normal') {
        const p = document.createElement('p');
        p.textContent = message;
        if (type === 'important') p.style.color = 'var(--primary-color)';
        if (type === 'bad') p.style.color = '#ff4d4d';
        logContent.prepend(p);
    }

    // Dice & Turn Control
    rollBtn.addEventListener('click', handleTurn);
    autoBtn.addEventListener('click', toggleAutoMode);

    function toggleAutoMode() {
        autoMode = !autoMode;
        autoBtn.textContent = autoMode ? "Desativar IA" : "Modo Auto (IA)";
        autoBtn.classList.toggle('active');
        if (autoMode && !isMoving && !isGameOver) {
            handleTurn();
        }
    }

    async function handleTurn() {
        if (isGameOver || isMoving) return;

        const player = players[currentPlayerIndex];

        // Check if skipping turn
        if (player.skipNextTurn) {
            addLog(`${player.name} está pulando a vez (Pena do Mercado ou Carta).`, 'bad');
            player.skipNextTurn = false;
            nextPlayer();
            return;
        }

        if (player.finished) {
            nextPlayer();
            return;
        }

        isMoving = true;
        rollBtn.disabled = true;

        // Dice Roll
        diceEl.classList.add('rolling');
        await wait(600);
        const roll = Math.floor(Math.random() * 6) + 1;
        diceEl.classList.remove('rolling');
        diceEl.textContent = roll;
        addLog(`${player.name} tirou ${roll} no dado.`);

        // Movement Step by Step
        let targetPos = player.position + roll;
        if (targetPos >= 27) targetPos = 27;

        for (let i = player.position; i < targetPos; i++) {
            await wait(200);
            player.position++;
            renderPlayers();
        }

        // Logic for landing
        await handleLandedHouse(player);

        if (!isGameOver) {
            isMoving = false;
            rollBtn.disabled = false;
            
            // If auto mode, proceed to next
            if (autoMode) {
                await wait(1000);
                nextPlayer();
            } else {
                nextPlayer();
            }
        }
    }

    function nextPlayer() {
        if (isGameOver) return;
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        
        // If the new player is already finished, skip them (unless everyone is finished which shouldn't happen here)
        if (players[currentPlayerIndex].finished) {
            // Find next avail
            let count = 0;
            while (players[currentPlayerIndex].finished && count < players.length) {
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
                count++;
            }
        }
        
        updateStats();

        if (autoMode && !isMoving && !isGameOver) {
            setTimeout(handleTurn, 500);
        }
    }

    // House Logic
    async function handleLandedHouse(player) {
        const house = board[player.position];
        
        if (player.position === 27) {
            await handleFinish(player);
            return;
        }

        switch (house.type) {
            case 'green':
                const gain = Math.floor(Math.random() * 4) + 2; // +2 to +5
                player.credits += gain;
                addLog(`${player.name} caiu numa casa SUSTENTÁVEL! Ganhou +${gain} créditos.`, 'important');
                showFeedback(player, `+${gain}`, 'green');
                break;

            case 'red':
                await handleRedHouse(player);
                break;

            case 'gray':
                await handleGrayHouse(player);
                break;
        }
        
        updateStats();
    }

    async function handleRedHouse(player) {
        const penaltyValue = Math.floor(Math.random() * 4) + 2; // 2 to 5
        
        if (autoMode || player.isAI) {
            // Simple AI Logic: If credits > 7 OR having very few credits, maybe pay? 
            // Let's say 50/50 for "student AI" feel
            if (player.credits >= 2 && Math.random() > 0.5) {
                await applyCarbonMarket(player);
            } else {
                applyPenalty(player, penaltyValue);
            }
            return;
        }

        // Show Modal for Human Choice
        return new Promise((resolve) => {
            showModal(
                "🛒 Mercado de Carbono",
                `Você caiu em uma casa POLUENTE! Perca <b>${penaltyValue} créditos</b> ou use a regra especial:`,
                [
                    { 
                        text: `Pagar ${penaltyValue} créditos (Penalidade normal)`, 
                        action: () => {
                            applyPenalty(player, penaltyValue);
                            resolve();
                        }
                    },
                    { 
                        text: `Pagar 2 créditos -> Ignorar pena, Mover +1 e pular próxima vez`, 
                        action: async () => {
                            if (player.credits >= 2) {
                                await applyCarbonMarket(player);
                                resolve();
                            } else {
                                alert("Créditos insuficientes para o Mercado de Carbono!");
                                // Wait for another choice or force penalty
                                applyPenalty(player, penaltyValue);
                                resolve();
                            }
                        }
                    }
                ]
            );
        });
    }

    function applyPenalty(player, value) {
        player.credits -= value;
        if (player.credits < 0) player.credits = 0;
        addLog(`${player.name} caiu numa casa POLUENTE e perdeu ${value} créditos.`, 'bad');
        showFeedback(player, `-${value}`, 'red');
        hideModal();
    }

    async function applyCarbonMarket(player) {
        player.credits -= 2;
        player.skipNextTurn = true;
        addLog(`${player.name} usou o Mercado de Carbono! Pagou 2, avançou +1 mas pulará a vez.`, 'important');
        
        // Advance 1 move
        if (player.position < 27) {
            player.position++;
            renderPlayers();
            await wait(300);
            // Notice: landing on checking result of the +1 move is not explicitly in description rules 
            // but usually board games do. The prompt says "Avançar 1 casa adicional". 
            // I'll just check if it's the end.
            if (player.position === 27) await handleFinish(player);
        }
        
        hideModal();
    }

    async function handleGrayHouse(player) {
        const cards = [
            { t: "Incentivo Verde", d: "Ganhou +4 créditos!", e: (p) => { p.credits += 4; } },
            { t: "Multa Ambiental", d: "Perdeu -3 créditos!", e: (p) => { p.credits = Math.max(0, p.credits - 3); } },
            { t: "Vento a Favor", d: "Avance 3 casas!", e: async (p) => { 
                const move = 3; 
                for(let i=0; i<move && p.position < 27; i++) {
                    p.position++; renderPlayers(); await wait(200);
                }
            }},
            { t: "Estrada Bloqueada", d: "Volte 2 casas!", e: async (p) => { 
                const move = 2; 
                for(let i=0; i<move && p.position > 0; i++) {
                    p.position--; renderPlayers(); await wait(200);
                }
            }},
            { t: "Coleta Seletiva", d: "Roube 2 créditos do jogador à sua frente!", e: (p) => { 
                // Find someone ahead
                const ahead = players.filter(other => other.position > p.position && !other.finished);
                if (ahead.length > 0) {
                    const target = ahead[Math.floor(Math.random() * ahead.length)];
                    const stolen = Math.min(target.credits, 2);
                    target.credits -= stolen;
                    p.credits += stolen;
                    addLog(`${p.name} roubou ${stolen} de ${target.name}!`);
                } else {
                    addLog("Ninguém à frente para roubar.");
                }
            }},
            { t: "Manutenção", d: "Perca a próxima rodada.", e: (p) => { p.skipNextTurn = true; } },
            { t: "Energia Solar", d: "Jogue novamente!", e: (p) => { 
                addLog(`${p.name} ganhou um turno extra!`);
                // Simple hack: decrement index so nextPlayer brings it back to same
                currentPlayerIndex = (currentPlayerIndex - 1 + players.length) % players.length;
            }}
        ];

        const card = cards[Math.floor(Math.random() * cards.length)];
        
        if (autoMode) {
            addLog(`${player.name} comprou carta: ${card.t} - ${card.d}`, 'important');
            await card.e(player);
            return;
        }

        return new Promise((resolve) => {
            showModal(
                "🃏 Carta de Evento",
                `<b>${card.t}</b><br>${card.d}`,
                [{ 
                    text: "Entendido!", 
                    action: async () => {
                        await card.e(player);
                        hideModal();
                        resolve();
                    }
                }]
            );
        });
    }

    // End Game Logic
    async function handleFinish(player) {
        if (player.finished) return;
        
        player.finished = true;
        const finishers = players.filter(p => p.finished).length;
        
        let bonus = 0;
        if (finishers === 1) bonus = 5;
        else if (finishers === 2) bonus = 3;
        else if (finishers === 3) bonus = 1;

        player.credits += bonus;
        addLog(`${player.name} CHEGOU AO FIM! Bônus de chegada: +${bonus} créditos.`, 'important');
        
        // Game ends when ANY player reaches the end (as per prompt "O jogo termina quando: Um jogador chega à última casa do tabuleiro")
        // Wait, "Um jogador chega à última casa" logic.
        isGameOver = true;
        await wait(1000);
        showFinalResults();
    }

    function showFinalResults() {
        // Calculate winner
        const results = [...players].sort((a, b) => b.credits - a.credits);
        const winner = results[0];

        let resultsHTML = `<div class="results-table">
            <p>O grande vencedor é <b>${winner.name}</b> com ${winner.credits} créditos!</p><br>
            <table style="width:100%; text-align:left; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #444">
                    <th>Jogador</th>
                    <th>Créditos Final</th>
                </tr>
        `;

        results.forEach(p => {
            resultsHTML += `
                <tr style="border-bottom: 1px solid #222">
                    <td>${p.icon} ${p.name}</td>
                    <td>${p.credits}</td>
                </tr>
            `;
        });

        resultsHTML += `</table></div>`;

        showModal("🏆 Fim de Jogo!", resultsHTML, [
            { text: "Jogar Novamente", action: () => location.reload() }
        ]);
        
        autoMode = false;
        rollBtn.disabled = true;
    }

    // Helpers
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    function showModal(title, text, options) {
        modalTitle.innerHTML = title;
        modalText.innerHTML = text;
        modalOptions.innerHTML = '';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = opt.text;
            btn.onclick = opt.action;
            modalOptions.appendChild(btn);
        });

        modalOverlay.classList.remove('hidden');
    }

    function hideModal() {
        modalOverlay.classList.add('hidden');
    }

    function showFeedback(player, text, color) {
        const house = document.getElementById(`house-${player.position}`);
        const feedback = document.createElement('div');
        feedback.className = 'feedback-pop';
        feedback.textContent = text;
        feedback.style.color = color === 'green' ? '#2ecc71' : '#e74c3c';
        feedback.style.position = 'absolute';
        feedback.style.top = '0';
        feedback.style.fontWeight = '800';
        feedback.style.fontSize = '1.5rem';
        feedback.style.animation = 'floatUp 1s forwards';
        house.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);
    }

    init();
});
