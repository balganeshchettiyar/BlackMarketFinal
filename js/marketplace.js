class Marketplace {
    constructor() {
        this.currentCategory = 'hints';
        this.isProcessing = false;
        this.displayedMoney = 0;
        this.marketState = null;
        this.init();
    }

    async init() {
        const teamId = TeamService.getCurrentTeam();
        this.teamState = await TeamService.getTeamState(teamId);
        this.marketState = await TeamService.getMarketState();
        this.displayedMoney = this.teamState.money;
        
        document.getElementById('hub-team-id').innerText = this.teamState.teamName.toUpperCase();
        document.getElementById('hub-funds').innerText = `${BLACK_MARKET_CONFIG.currencySymbol}${this.displayedMoney}`;
        
        if (!document.getElementById('hub-market-index')) {
            const mktDiv = document.createElement('div');
            mktDiv.className = 'market-index-display';
            mktDiv.innerHTML = `MARKET INDEX: <span id="hub-market-index">${this.marketState.multiplier.toFixed(2)}×</span>`;
            document.querySelector('.hub-header').appendChild(mktDiv);
        } else {
            document.getElementById('hub-market-index').innerText = `${this.marketState.multiplier.toFixed(2)}×`;
        }

        window.addEventListener('marketStateUpdated', async () => {
            this.marketState = await TeamService.getMarketState();
            const idxEl = document.getElementById('hub-market-index');
            if (idxEl) {
                idxEl.innerText = `${this.marketState.multiplier.toFixed(2)}×`;
                idxEl.classList.add('price-rising');
                setTimeout(() => idxEl.classList.remove('price-rising'), 500);
            }
            this.renderCategory(this.currentCategory);
        });

        this.lastKnownAttacks = this.teamState.receivedAttacks ? this.teamState.receivedAttacks.length : 0;
        
        window.addEventListener('storage', async (e) => {
            const currentTeamId = TeamService.getCurrentTeam();
            if (e.key === `blackMarketState_${currentTeamId}`) {
                this.teamState = await TeamService.getTeamState(currentTeamId);
                
                if (this.teamState.money !== this.displayedMoney && !this.isProcessing) {
                    this.displayedMoney = this.teamState.money;
                    document.getElementById('hub-funds').innerText = `${BLACK_MARKET_CONFIG.currencySymbol}${this.displayedMoney}`;
                }

                if (this.teamState.receivedAttacks && this.teamState.receivedAttacks.length > this.lastKnownAttacks) {
                    const newAttacks = this.teamState.receivedAttacks.slice(this.lastKnownAttacks);
                    this.lastKnownAttacks = this.teamState.receivedAttacks.length;
                    
                    newAttacks.forEach(attack => {
                        this.showAttackNotification(attack);
                    });
                }
            } else if (e.key === 'blackMarket_marketState') {
                window.dispatchEvent(new Event('marketStateUpdated'));
            }
        });

        this.setupNavigation();
        this.renderCategory(this.currentCategory);


        if (DEBUG_MODE) {
            const select = document.getElementById('debug-team-select');
            if (select) {
                select.value = teamId;
                select.addEventListener('change', async (e) => {
                    TeamService.setCurrentTeam(e.target.value);
                    await this.init(); // reload hub for new team
                });
            }
            
            const btnReset = document.getElementById('debug-reset-team');
            if (btnReset) {
                btnReset.addEventListener('click', async () => {
                    const current = TeamService.getCurrentTeam();
                    localStorage.removeItem(`blackMarketState_${current}`);
                    localStorage.removeItem('blackMarket_marketState');
                    await this.init();
                });
            }

            const btnSetMoney = document.getElementById('debug-set-money');
            if (btnSetMoney) {
                btnSetMoney.addEventListener('click', async () => {
                    const money = parseInt(document.getElementById('debug-money-input').value, 10);
                    if (!isNaN(money)) {
                        const current = TeamService.getCurrentTeam();
                        let state = await TeamService.getTeamState(current);
                        state.money = money;
                        localStorage.setItem(`blackMarketState_${current}`, JSON.stringify(state));
                        await this.init();
                    }
                });
            }

            const btnSetInflation = document.getElementById('debug-set-inflation');
            if (btnSetInflation) {
                btnSetInflation.addEventListener('click', async () => {
                    const mult = parseFloat(document.getElementById('debug-inflation-input').value);
                    if (!isNaN(mult)) {
                        let marketState = await TeamService.getMarketState();
                        marketState.multiplier = mult;
                        localStorage.setItem('blackMarket_marketState', JSON.stringify(marketState));
                        window.dispatchEvent(new Event('marketStateUpdated'));
                    }
                });
            }

            window.addEventListener('adminEventLog', (e) => {
                const logContainer = document.getElementById('debug-event-log');
                if (logContainer) {
                    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
                    const div = document.createElement('div');
                    div.innerText = `[${time}] ${e.detail}`;
                    logContainer.appendChild(div);
                    logContainer.scrollTop = logContainer.scrollHeight;
                }
            });
        }
    }

    setupNavigation() {
        const buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isProcessing) return;
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const newCategory = btn.getAttribute('data-tab');
                if (newCategory !== this.currentCategory) {
                    this.transitionCategory(newCategory);
                }
            });
        });
    }

    async transitionCategory(newCategory) {
        const contentArea = document.getElementById('hub-content-area');
        contentArea.style.opacity = '0';
        
        setTimeout(() => {
            this.currentCategory = newCategory;
            this.renderCategory(newCategory);
            
            // Subtly glitch/scanline transition
            contentArea.classList.add('transition-glitch');
            contentArea.style.opacity = '1';
            
            setTimeout(() => {
                contentArea.classList.remove('transition-glitch');
            }, 300);
        }, 200);
    }

    async renderCategory(category) {
        const contentArea = document.getElementById('hub-content-area');
        contentArea.innerHTML = '';

        if (category === 'activity') {
            this.renderActivity(contentArea);
            return;
        }

        if (category === 'inventory') {
            await this.renderInventory(contentArea);
            return;
        }

        if (category === 'mystery_history') {
            this.renderMysteryHistory(contentArea);
            return;
        }

        const items = BLACK_MARKET_CONFIG.items[category];
        if (!items) return;

        let groupedItems = { "ALL": items };
        if (category === 'buffs') {
            groupedItems = {};
            items.forEach(i => {
                const sub = i.subCategory || "OTHER";
                if (!groupedItems[sub]) groupedItems[sub] = [];
                groupedItems[sub].push(i);
            });
        } else if (category === 'hints') {
            groupedItems = {};
            items.forEach(i => {
                const sub = i.gameId || "OTHER";
                if (!groupedItems[sub]) groupedItems[sub] = [];
                groupedItems[sub].push(i);
            });
        }

        for (const [groupName, groupItems] of Object.entries(groupedItems)) {
            if (category === 'buffs' || category === 'hints') {
                const header = document.createElement('div');
                header.className = 'subcategory-header';
                header.innerText = `// ${groupName}`;
                contentArea.appendChild(header);
            }

            groupItems.forEach(item => {
                const ownedCount = this.teamState.purchasedItems.filter(id => id === item.id).length;
                const isOwned = ownedCount > 0;
                const maxReached = item.maxPurchases && ownedCount >= item.maxPurchases;

                const card = document.createElement('div');
                card.className = `item-card ${isOwned ? 'owned' : ''}`;
                
                let targetHtml = '';
                if (item.requiresTarget && !maxReached) {
                    targetHtml = `<select class="target-select" id="target-${item.id}">
                        <option value="">SELECT TARGET</option>
                        <option value="TEAM_01">TEAM 01</option>
                        <option value="TEAM_02">TEAM 02</option>
                        <option value="TEAM_07">TEAM 07</option>
                        <option value="TEAM_14">TEAM 14</option>
                    </select>`;
                }

                let btnHtml = '';
                if (maxReached) {
                    if (category === 'hints') {
                        const invItem = this.teamState.inventory.hints.find(i => i.itemId === item.id);
                        if (invItem && invItem.revealed) {
                            btnHtml = `<button class="ui-btn disabled">[ ALREADY ACQUIRED ]</button>`;
                        } else {
                            btnHtml = `<button class="ui-btn reveal-btn" data-id="${item.id}" data-category="${category}">[ REVEAL INTEL ]</button>`;
                        }
                    } else if (category === 'mystery') {
                        btnHtml = `<button class="ui-btn disabled">[ IDENTIFIED ]</button>`;
                    } else {
                        btnHtml = `<button class="ui-btn disabled">[ MAX ACQUIRED ]</button>`;
                    }
                } else {
                    btnHtml = `<button class="ui-btn buy-btn" data-id="${item.id}" data-category="${category}">[ ACQUIRE ]</button>`;
                }

                let descHtml = `<div class="item-desc">${item.description}</div>`;
                if (category === 'mystery') {
                    descHtml = `<div class="item-desc">TIER: ${item.tier}</div>`;
                    const invMystery = this.teamState.inventory.mystery;
                    if (invMystery && invMystery.length > 0) {
                        const lastMystery = invMystery.slice().reverse().find(m => m.itemId === item.id);
                        if (lastMystery && lastMystery.revealed && lastMystery.result) {
                            descHtml += `<div class="item-desc highlight-desc">Previous Result: ${lastMystery.result.name}</div>`;
                        }
                    }
                }

                const currentPrice = Math.round(item.basePrice * this.marketState.multiplier);

                let infoBtnHtml = '';
                if (category === 'buffs' || category === 'mystery') {
                    infoBtnHtml = `<div class="item-info-btn" data-id="${item.id}" data-category="${category}">[?]</div>`;
                }

                card.innerHTML = `
                    <div class="item-header">
                        <div class="item-title">${item.name}</div>
                        <div class="item-header-right">
                            ${ownedCount > 0 ? `<div class="item-owned-indicator">OWNED ×${ownedCount}</div>` : ''}
                            ${infoBtnHtml}
                        </div>
                    </div>
                    ${descHtml}
                    ${targetHtml}
                    <div class="item-footer">
                        <div class="item-price">COST: <span>${BLACK_MARKET_CONFIG.currencySymbol}${currentPrice}</span></div>
                        ${btnHtml}
                    </div>
                `;
                
                contentArea.appendChild(card);
            });
        }

        // Add event listeners
        contentArea.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePurchase(e.target));
        });
        
        contentArea.querySelectorAll('.reveal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleReveal(e.target));
        });

        contentArea.querySelectorAll('.item-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showItemInfo(e.target));
        });
    }

    async renderInventory(contentArea) {
        const allTeams = await TeamService.getAllTeams();
        const currentTeam = TeamService.getCurrentTeam();

        let html = '<div class="inventory-container">';
        
        // Render Buffs (attack, defense, utility, gamble)
        ['attack', 'defense', 'utility', 'gamble'].forEach(subCat => {
            const counts = {};
            if (this.teamState.inventory[subCat]) {
                this.teamState.inventory[subCat].forEach(invItem => {
                    counts[invItem.itemId] = (counts[invItem.itemId] || 0) + 1;
                });
            }
            if (subCat === 'defense' && this.teamState.activeEffects) {
                this.teamState.activeEffects.forEach(effect => {
                    if (counts[effect.itemId] === undefined) counts[effect.itemId] = 0;
                });
            }

            if (Object.keys(counts).length > 0) {
                html += `<div class="subcategory-header">// ${subCat.toUpperCase()}</div>`;
                
                for (const [itemId, count] of Object.entries(counts)) {
                    const item = BLACK_MARKET_CONFIG.items.buffs.find(i => i.id === itemId);
                    if (item) {
                        const activeEffectsCount = this.teamState.activeEffects ? this.teamState.activeEffects.filter(e => e.itemId === itemId).length : 0;
                        
                        let actionHtml = '';
                        let targetHtml = '';
                        let statusHtml = '';

                        if (activeEffectsCount > 0) {
                            statusHtml += `<div class="item-desc highlight-desc" style="color:#00ffaa; margin-top:5px;">STATUS: ACTIVE (${activeEffectsCount})</div>`;
                        }
                        
                        if (count > 0) {
                            if (item.subCategory === 'ATTACK') {
                                targetHtml = `<select class="target-select deploy-target" id="deploy-target-${item.id}">
                                    <option value="">SELECT TARGET</option>`;
                                allTeams.forEach(t => {
                                    if (t !== currentTeam) {
                                        targetHtml += `<option value="${t}">${t.replace('TEAM_','TEAM ')}</option>`;
                                    }
                                });
                                targetHtml += `</select>`;
                                actionHtml = `<button class="ui-btn deploy-btn" data-id="${item.id}">[ LAUNCH ]</button>`;
                            } else if (item.subCategory === 'DEFENSE') {
                                actionHtml = `<button class="ui-btn deploy-btn" data-id="${item.id}">[ ACTIVATE ]</button>`;
                            } else {
                                actionHtml = `<button class="ui-btn deploy-btn" data-id="${item.id}">[ USE ]</button>`;
                            }
                        }

                        html += `
                            <div class="item-card owned">
                                <div class="item-header">
                                    <div class="item-title">${item.name}</div>
                                    <div class="item-header-right">
                                        <div class="item-owned-indicator">OWNED ×${count}</div>
                                    </div>
                                </div>
                                <div class="item-desc">${item.description}</div>
                                ${statusHtml}
                                ${targetHtml}
                                ${actionHtml ? `<div class="item-footer" style="margin-top:10px;">${actionHtml}</div>` : ''}
                            </div>
                        `;
                    }
                }
            }
        });

        // Render Hints
        if (this.teamState.inventory.hints && this.teamState.inventory.hints.length > 0) {
            html += `<div class="subcategory-header">// HINTS</div>`;
            const counts = {};
            this.teamState.inventory.hints.forEach(invItem => {
                counts[invItem.itemId] = (counts[invItem.itemId] || 0) + 1;
            });
            
            for (const [itemId, count] of Object.entries(counts)) {
                const item = BLACK_MARKET_CONFIG.items.hints.find(i => i.id === itemId);
                if (item) {
                    html += `
                        <div class="item-card owned">
                            <div class="item-header">
                                <div class="item-title">${item.gameId} - ${item.name}</div>
                                <div class="item-header-right">
                                    <div class="item-owned-indicator">OWNED ×${count}</div>
                                </div>
                            </div>
                            <div class="item-desc">TIER: ${item.tier.toUpperCase()}</div>
                            <div class="item-footer" style="margin-top:10px;">
                                <button class="ui-btn view-hint-btn" data-id="${item.id}">[ VIEW ]</button>
                            </div>
                        </div>
                    `;
                }
            }
        }
        
        // Render Mystery items (Decoys/Empty)
        if (this.teamState.inventory.mystery && this.teamState.inventory.mystery.length > 0) {
            html += `<div class="subcategory-header">// OTHER</div>`;
            this.teamState.inventory.mystery.forEach(invItem => {
                html += `
                    <div class="item-card">
                        <div class="item-header">
                            <div class="item-title">${invItem.name || invItem.itemId}</div>
                        </div>
                        <div class="item-desc">${invItem.type === 'empty' ? 'Empty Package' : 'Decoy Item'}</div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        contentArea.innerHTML = html;

        contentArea.querySelectorAll('.deploy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDeploy(e.target));
        });
        contentArea.querySelectorAll('.view-hint-btn').forEach(btn => {
            btn.addEventListener('click', () => alert("Hint contents will be revealed here."));
        });
    }

    renderActivity(contentArea) {
        if (!this.teamState.eventLog || this.teamState.eventLog.length === 0) {
            contentArea.innerHTML = '<div class="inventory-container"><div class="item-desc">No recent activity.</div></div>';
            return;
        }

        let html = '<div class="inventory-container">';
        html += `<div class="subcategory-header">// EVENT LOG</div>`;
        
        const historyRev = [...this.teamState.eventLog].reverse();
        
        historyRev.forEach(event => {
            const timeStr = new Date(event.timestamp).toLocaleTimeString();
            html += `
                <div class="item-card">
                    <div class="item-header">
                        <div class="item-title" style="color:#aaa;">${timeStr}</div>
                    </div>
                    <div class="item-desc" style="color:#fff; font-size:14px; margin-top:5px;">${event.text}</div>
                </div>
            `;
        });
        
        html += '</div>';
        contentArea.innerHTML = html;
    }

    renderMysteryHistory(contentArea) {
        if (!this.teamState.mysteryHistory || this.teamState.mysteryHistory.length === 0) {
            contentArea.innerHTML = '<div class="inventory-container"><div class="item-desc">No mystery bundles opened yet.</div></div>';
            return;
        }

        let html = '<div class="inventory-container">';
        html += `<div class="subcategory-header">// MYSTERY HISTORY</div>`;
        
        const historyRev = [...this.teamState.mysteryHistory].reverse();
        
        historyRev.forEach(hist => {
            const timeStr = new Date(hist.purchasedAt).toLocaleTimeString();
            let contentsList = '';
            
            if (Array.isArray(hist.result)) {
                contentsList = hist.result.map(item => {
                    if (item.type === 'buff') {
                        const buff = BLACK_MARKET_CONFIG.items.buffs.find(b => b.id === item.itemId);
                        return `- ${item.quantity || 1}x ${buff ? buff.name : item.itemId}`;
                    } else if (item.type === 'hint') {
                        const hint = BLACK_MARKET_CONFIG.items.hints.find(h => h.id === item.itemId);
                        return `- ${item.quantity || 1}x ${hint ? hint.name : item.itemId}`;
                    } else if (item.type === 'money') {
                        return `- ${BLACK_MARKET_CONFIG.currencySymbol}${item.value}`;
                    } else {
                        return `- ${item.name || item.itemId}`;
                    }
                }).join('<br>');
            } else {
                contentsList = hist.result ? hist.result.name : 'Unknown';
            }

            html += `
                <div class="item-card">
                    <div class="item-header">
                        <div class="item-title">TXN: ${hist.txnId}</div>
                        <div class="item-header-right">
                            <div class="item-owned-indicator">${timeStr}</div>
                        </div>
                    </div>
                    <div class="item-desc" style="white-space: pre-line;">${contentsList}</div>
                </div>
            `;
        });
        
        html += '</div>';
        contentArea.innerHTML = html;
    }

    showItemInfo(button) {
        const itemId = button.getAttribute('data-id');
        const category = button.getAttribute('data-category');
        const item = BLACK_MARKET_CONFIG.items[category].find(i => i.id === itemId);
        if (!item) return;

        let modal = document.getElementById('item-info-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'item-info-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content cinematic-panel">
                    <div class="modal-header">
                        <h2 id="modal-item-name"></h2>
                        <button id="modal-close-btn">[X]</button>
                    </div>
                    <div id="modal-item-category" class="modal-category"></div>
                    <div class="modal-body">
                        <div id="modal-item-desc" class="modal-desc"></div>
                        <div id="modal-item-full" class="modal-full"></div>
                        <div id="modal-item-restrictions" class="modal-restrictions"></div>
                        <div id="modal-item-strategic" class="modal-strategic"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('modal-close-btn').addEventListener('click', () => {
                modal.classList.remove('visible');
            });
            // Close on click outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('visible');
            });
        }

        document.getElementById('modal-item-name').innerText = item.name;
        document.getElementById('modal-item-category').innerText = (item.subCategory || category).toUpperCase();
        document.getElementById('modal-item-desc').innerText = item.description;
        document.getElementById('modal-item-full').innerText = item.fullDescription || '';
        
        let restrictionsHtml = '';
        if (item.restrictions) {
            restrictionsHtml = Object.entries(item.restrictions).map(([k, v]) => {
                return `<div><span class="restriction-key">${k.toUpperCase()}:</span> <span class="restriction-value">${v}</span></div>`;
            }).join('');
        }
        document.getElementById('modal-item-restrictions').innerHTML = restrictionsHtml;
        
        document.getElementById('modal-item-strategic').innerText = item.strategicText ? `"${item.strategicText}"` : '';

        modal.classList.add('visible');
    }

    async handlePurchase(button) {
        if (this.isProcessing) return;

        const itemId = button.getAttribute('data-id');
        const category = button.getAttribute('data-category');
        const originalText = button.innerText;

        const targetSelect = document.getElementById(`target-${itemId}`);
        let targetTeamId = null;
        if (targetSelect) {
            targetTeamId = targetSelect.value;
            if (!targetTeamId) {
                alert("PLEASE SELECT A TARGET TEAM.");
                return;
            }
            if (targetTeamId === TeamService.getCurrentTeam()) {
                alert("CANNOT TARGET YOUR OWN TEAM.");
                return;
            }
        }

        if (confirm(`CONFIRM PURCHASE?\nCost may have changed due to market inflation.\nThis action cannot be undone.`)) {
            this.isProcessing = true;
            button.innerText = '[ PROCESSING... ]';
            button.classList.add('processing');

            try {
                const teamId = TeamService.getCurrentTeam();
                await new Promise(r => setTimeout(r, 600)); 

                const result = await TeamService.purchaseItem(teamId, category, itemId, targetTeamId);
                
                if (category === 'mystery') {
                    button.innerText = '[ UNLOCKING... ]';
                    await new Promise(r => setTimeout(r, 800));
                    button.innerText = '[ CORRUPTING... ]';
                    await new Promise(r => setTimeout(r, 800));
                    if (result.mysteryReveal) {
                        const contentsList = result.mysteryReveal.map(item => {
                            if (item.type === 'buff') {
                                const buff = BLACK_MARKET_CONFIG.items.buffs.find(b => b.id === item.itemId);
                                return `- ${item.quantity || 1}x ${buff ? buff.name : item.itemId}`;
                            } else if (item.type === 'hint') {
                                const hint = BLACK_MARKET_CONFIG.items.hints.find(h => h.id === item.itemId);
                                return `- ${item.quantity || 1}x ${hint ? hint.name : item.itemId}`;
                            } else if (item.type === 'money') {
                                return `- ${BLACK_MARKET_CONFIG.currencySymbol}${item.value}`;
                            } else {
                                return `- ${item.name || item.itemId}`;
                            }
                        }).join('\n');
                        alert(`MYSTERY BUNDLE OPENED:\n\n${contentsList}`);
                    }
                }

                this.teamState = await TeamService.getTeamState(teamId);
                this.animateMoneyChange(result.effectivePrice, result.newBalance);

                button.innerText = '[ ACQUIRED ]';
                button.classList.remove('processing');
                button.classList.add('success');
                
                setTimeout(() => {
                    this.renderCategory(category);
                    this.isProcessing = false;
                }, 1000);

            } catch (error) {
                button.innerText = '[ ERROR ]';
                button.classList.remove('processing');
                button.classList.add('error');
                
                if (error.message === "INSUFFICIENT FUNDS") {
                    const fundsEl = document.getElementById('hub-funds');
                    fundsEl.classList.add('insufficient-flash');
                    setTimeout(() => fundsEl.classList.remove('insufficient-flash'), 1000);
                } else if (error.message === "TARGET REQUIRED") {
                    alert("TARGET REQUIRED FOR THIS ITEM.");
                } else {
                    alert(error.message);
                }
                
                setTimeout(() => {
                    button.innerText = originalText;
                    button.classList.remove('error');
                    this.isProcessing = false;
                }, 1500);
            }
        }
    }

    async handleReveal(button) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const itemId = button.getAttribute('data-id');
        const category = button.getAttribute('data-category');
        
        button.innerText = '[ DECRYPTING... ]';
        button.classList.add('processing');
        
        try {
            await new Promise(r => setTimeout(r, 1000));
            const teamId = TeamService.getCurrentTeam();
            await TeamService.revealItem(teamId, category, itemId);
            this.teamState = await TeamService.getTeamState(teamId);
            
            button.classList.remove('processing');
            this.renderCategory(category);
        } catch (error) {
            button.innerText = '[ ERROR ]';
            button.classList.remove('processing');
        } finally {
            this.isProcessing = false;
        }
    }

    async handleDeploy(button) {
        if (this.isProcessing) return;

        const itemId = button.getAttribute('data-id');
        const item = BLACK_MARKET_CONFIG.items.buffs.find(i => i.id === itemId);
        
        let targetTeamId = null;
        if (item.subCategory === 'ATTACK') {
            const targetSelect = document.getElementById(`deploy-target-${itemId}`);
            if (targetSelect) {
                targetTeamId = targetSelect.value;
                if (!targetTeamId) {
                    alert("PLEASE SELECT A TARGET TEAM.");
                    return;
                }
            }
        }

        let confirmMsg = `DEPLOY ${item.name}?`;
        if (item.id === 'nuke') {
            confirmMsg = `WARNING: THIS ACTION WILL CONSUME 1 NUCLEAR OPTION.\n\nTHE TARGET WILL RECEIVE THE NUCLEAR EFFECT.\n\nCONFIRM NUCLEAR LAUNCH?`;
        } else if (item.subCategory === 'DEFENSE') {
            confirmMsg = `ACTIVATE ${item.name}?\n\nIt will remain active until triggered.`;
        }

        if (confirm(confirmMsg)) {
            this.isProcessing = true;
            const originalText = button.innerText;
            button.innerText = '[ DEPLOYING... ]';
            button.classList.add('processing');

            try {
                const teamId = TeamService.getCurrentTeam();
                await new Promise(r => setTimeout(r, 600)); 

                await TeamService.deployItem(teamId, itemId, targetTeamId);
                
                this.teamState = await TeamService.getTeamState(teamId);
                
                button.innerText = '[ DEPLOYED ]';
                button.classList.remove('processing');
                button.classList.add('success');
                
                setTimeout(() => {
                    this.renderCategory('inventory');
                    this.isProcessing = false;
                }, 1000);

            } catch (error) {
                button.innerText = '[ ERROR ]';
                button.classList.remove('processing');
                button.classList.add('error');
                alert(error.message);
                
                setTimeout(() => {
                    button.innerText = originalText;
                    button.classList.remove('error');
                    this.isProcessing = false;
                }, 1500);
            }
        }
    }

    showAttackNotification(attack) {
        let title = "ATTACK DETECTED";
        let msg = `WARNING: YOU WERE ATTACKED BY ${attack.attackerId}!\nWeapon: ${attack.attackItem.toUpperCase()}`;
        
        if (attack.attackItem === 'nuke') {
            title = "☢️ NUCLEAR STRIKE DETECTED";
            msg = `WARNING: NUCLEAR STRIKE LAUNCHED BY ${attack.attackerId}!`;
        } else if (attack.attackItem === 'bomb') {
            title = "💣 BOMB PLANTED";
            msg = `WARNING: DEVICE PLANTED BY ${attack.attackerId}!`;
        } else if (attack.attackItem === 'lockdown') {
            title = "🔒 TASK LOCKED";
            msg = `WARNING: LOCKDOWN INITIATED BY ${attack.attackerId}!`;
        } else if (attack.attackItem === 'sabotage') {
            title = "⚠️ SABOTAGE DETECTED";
            msg = `WARNING: YOU HAVE BEEN SABOTAGED BY ${attack.attackerId}!`;
        }

        if (attack.status === 'blocked') {
            title = attack.attackItem === 'nuke' ? "☢️ NUCLEAR STRIKE NEUTRALIZED" : "🛡️ ATTACK BLOCKED";
            msg += `\nStatus: BLOCKED BY DEFENSE SYSTEM`;
        } else if (attack.status === 'reflected') {
            title = "↩ ATTACK REFLECTED";
            msg += `\nStatus: REFLECTED BACK AT ATTACKER`;
        } else if (attack.status === 'reflected_back') {
            title = "↩ ATTACK REFLECTED";
            msg = `WARNING: YOUR ATTACK ON ${attack.attackerId} WAS REFLECTED BACK AT YOU!\nWeapon: ${attack.attackItem.toUpperCase()}`;
        } else if (attack.status === 'hidden') {
            title = "👻 ATTACK EVADED";
            msg += `\nStatus: EVADED VIA HIDEOUT`;
        } else {
            msg += `\nStatus: HIT DIRECTLY`;
        }
        
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '20px';
        overlay.style.left = '50%';
        overlay.style.transform = 'translateX(-50%)';
        overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
        overlay.style.color = '#fff';
        overlay.style.padding = '15px 30px';
        overlay.style.border = '2px solid #ff3c3c';
        overlay.style.borderRadius = '5px';
        overlay.style.zIndex = '10000';
        overlay.style.fontFamily = 'monospace';
        overlay.style.fontSize = '16px';
        overlay.style.textAlign = 'center';
        overlay.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
        overlay.style.animation = 'error-shake 0.3s ease-in-out';
        
        overlay.innerHTML = `<strong>${title}</strong><br><br>${msg.replace('\n', '<br>')}`;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 1s';
            setTimeout(() => overlay.remove(), 1000);
        }, 5000);
    }

    animateMoneyChange(deductedAmount, targetBalance) {
        const fundsEl = document.getElementById('hub-funds');
        const diffEl = document.getElementById('hub-funds-diff');
        
        // Show diff
        diffEl.innerText = `-${BLACK_MARKET_CONFIG.currencySymbol}${deductedAmount}`;
        diffEl.style.opacity = '1';
        diffEl.style.transform = 'translateY(0)';
        diffEl.classList.add('show-diff');
        
        // Animate count down
        const duration = 800; // ms
        const startTime = performance.now();
        const startMoney = this.displayedMoney;
        const change = targetBalance - startMoney;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            this.displayedMoney = Math.round(startMoney + change * easeOut);
            fundsEl.innerText = `${BLACK_MARKET_CONFIG.currencySymbol}${this.displayedMoney}`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.displayedMoney = targetBalance;
                fundsEl.innerText = `${BLACK_MARKET_CONFIG.currencySymbol}${this.displayedMoney}`;
                
                setTimeout(() => {
                    diffEl.classList.remove('show-diff');
                    diffEl.style.opacity = '0';
                    diffEl.style.transform = 'translateY(10px)';
                }, 1000);
            }
        };
        
        requestAnimationFrame(animate);
    }
}
