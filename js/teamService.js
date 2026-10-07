class TeamService {
    static getCurrentTeam() {
        return localStorage.getItem('currentTeamId') || 'TEAM_07';
    }

    static setCurrentTeam(teamId) {
        localStorage.setItem('currentTeamId', teamId);
    }

    static async getMarketState() {
        const stateStr = localStorage.getItem('blackMarket_marketState');
        if (stateStr) {
            try { return JSON.parse(stateStr); } catch(e) {}
        }
        return { multiplier: 1.0 };
    }

    static async saveMarketState(state) {
        localStorage.setItem('blackMarket_marketState', JSON.stringify(state));
        window.dispatchEvent(new Event('marketStateUpdated'));
    }

    static async getTeamState(teamId) {
        const stateStr = localStorage.getItem(`blackMarketState_${teamId}`);
        if (stateStr) {
            try {
                const parsed = JSON.parse(stateStr);
                if (parsed && typeof parsed === 'object') {
                    if (!parsed.version) parsed.version = 1;
                    if (!parsed.puzzleProgress) parsed.puzzleProgress = { cluesFound: [], riddleSolved: false, finalCodeEntered: false };
                    if (!parsed.teamName) parsed.teamName = `Team ${teamId.replace('TEAM_', '')}`;
                    if (parsed.codeAttempts === undefined) parsed.codeAttempts = 0;
                    if (parsed.money === undefined) parsed.money = BLACK_MARKET_CONFIG.initialTeamMoney;
                    if (!parsed.inventory) parsed.inventory = { hints: [], buffs: [], mystery: [], attack: [], defense: [], utility: [], gamble: [] };
                    if (!parsed.inventory.attack) {
                        parsed.inventory = { hints: parsed.inventory.hints || [], buffs: [], mystery: parsed.inventory.mystery || [], attack: [], defense: [], utility: [], gamble: [] };
                    }
                    if (!parsed.activeEffects) parsed.activeEffects = [];
                    if (!parsed.mysteryHistory) parsed.mysteryHistory = [];
                    if (!parsed.receivedAttacks) parsed.receivedAttacks = [];
                    if (!parsed.eventLog) parsed.eventLog = [];
                    return parsed;
                }
            } catch (error) {
                console.error("[BLACK MARKET] Failed to load saved state", error);
            }
        }
        
        const newState = {
            version: 2,
            teamId: teamId,
            teamName: `Team ${teamId.replace('TEAM_', '')}`,
            money: BLACK_MARKET_CONFIG.initialTeamMoney,
            blackMarketUnlocked: false,
            codeAttempts: 0,
            inventory: { hints: [], buffs: [], mystery: [], attack: [], defense: [], utility: [], gamble: [] },
            activeEffects: [],
            purchasedItems: [],
            transactions: [],
            mysteryHistory: [],
            receivedAttacks: [],
            eventLog: [],
            puzzleProgress: { cluesFound: [], riddleSolved: false, finalCodeEntered: false }
        };
        await this.saveTeamState(teamId, newState);
        return newState;
    }

    static async saveTeamState(teamId, state) {
        localStorage.setItem(`blackMarketState_${teamId}`, JSON.stringify(state));
    }

    static async getBalance(teamId) {
        const state = await this.getTeamState(teamId);
        return state.money;
    }

    static async getItemPrice(item) {
        const marketState = await this.getMarketState();
        return Math.round(item.basePrice * marketState.multiplier);
    }

    static async deductFunds(teamId, amount) {
        const state = await this.getTeamState(teamId);
        if (state.money < amount) throw new Error("INSUFFICIENT FUNDS");
        state.money -= amount;
        await this.saveTeamState(teamId, state);
        return state.money;
    }

    static async purchaseItem(teamId, category, itemId, targetTeamId = null) {
        const state = await this.getTeamState(teamId);
        const categoryItems = BLACK_MARKET_CONFIG.items[category];
        const item = categoryItems.find(i => i.id === itemId);
        if (!item) throw new Error("ITEM NOT FOUND");

        const effectivePrice = await this.getItemPrice(item);

        const ownedCount = state.purchasedItems.filter(id => id === itemId).length;
        if (item.maxPurchases && ownedCount >= item.maxPurchases) {
            throw new Error("ALREADY ACQUIRED");
        }

        if (state.money < effectivePrice) {
            throw new Error("INSUFFICIENT FUNDS");
        }

        if (item.requiresTarget && !targetTeamId) {
            throw new Error("TARGET REQUIRED");
        }

        if (item.subCategory === "ATTACK") {
            const hasHideoutIndex = state.inventory.defense ? state.inventory.defense.findIndex(i => i.itemId === 'hideout') : -1;
            if (hasHideoutIndex >= 0) {
                throw new Error("CANNOT ATTACK WHILE HIDEOUT IS ACTIVE");
            }
        }

        state.money -= effectivePrice;
        state.purchasedItems.push(itemId);

        const timestamp = new Date().toISOString();
        const txnId = `TXN_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        state.transactions.push({
            id: txnId,
            itemId: itemId,
            category: category,
            price: effectivePrice,
            timestamp: timestamp,
            balanceAfter: state.money,
            targetTeamId: targetTeamId
        });

        let mysteryReveal = null;

        if (category === 'mystery') {
            const bundleContents = this.calculateMysteryResult(itemId);
            mysteryReveal = bundleContents;
            state.mysteryHistory.push({
                txnId,
                purchasedAt: timestamp,
                result: bundleContents
            });
            
            bundleContents.forEach(itemConfig => {
                if (itemConfig.type === 'money') {
                    state.money += itemConfig.value;
                } else if (itemConfig.type === 'buff') {
                    const subCat = this.getSubcategoryByItemId(itemConfig.itemId);
                    if (subCat) {
                        for(let i=0; i < (itemConfig.quantity || 1); i++) {
                            state.inventory[subCat.toLowerCase()].push({ itemId: itemConfig.itemId, purchasedAt: timestamp });
                        }
                    }
                } else if (itemConfig.type === 'hint') {
                    for(let i=0; i < (itemConfig.quantity || 1); i++) {
                        state.inventory.hints.push({ itemId: itemConfig.itemId, purchasedAt: timestamp });
                    }
                } else {
                    // Decoy or Empty
                    state.inventory.mystery.push({ 
                        itemId: itemConfig.itemId || 'empty', 
                        name: itemConfig.name,
                        type: itemConfig.type,
                        purchasedAt: timestamp, 
                        revealed: true 
                    });
                }
            });
        } else {
            const invCategory = item.subCategory ? item.subCategory.toLowerCase() : category;
            if (!state.inventory[invCategory]) state.inventory[invCategory] = [];
            state.inventory[invCategory].push({
                itemId: itemId,
                purchasedAt: timestamp,
                revealed: false
            });
        }

        await this.saveTeamState(teamId, state);

        // Update Market Inflation
        const marketState = await this.getMarketState();
        marketState.multiplier = Math.min(MARKET_CONFIG.maximumMultiplier, marketState.multiplier * (1 + MARKET_CONFIG.inflationRate));
        await this.saveMarketState(marketState);

        let attackStatus = null;
        // If attack, apply it
        if (item.subCategory === "ATTACK" && targetTeamId) {
            attackStatus = await this.applyAttack(teamId, targetTeamId, item);
        }

        // Dispatch Admin Log Event
        let logMsg = `${teamId.replace('TEAM_','TEAM ')} purchased ${item.name.toUpperCase()}`;
        if (targetTeamId) logMsg += ` ... TARGET: ${targetTeamId.replace('TEAM_','TEAM ')}`;
        if (attackStatus) {
            if (attackStatus === 'blocked') logMsg += ` ... TARGET SHIELD DETECTED ... STRIKE BLOCKED ... DEFENSE CONSUMED`;
            else if (attackStatus === 'reflected') logMsg += ` ... TARGET REFLECTOR DETECTED ... STRIKE REFLECTED BACK ... DEFENSE CONSUMED`;
            else if (attackStatus === 'hidden') logMsg += ` ... TARGET IN HIDEOUT ... STRIKE MISSED`;
            else logMsg += ` ... TARGET HIT`;
        } else if (category === 'mystery' && mysteryReveal) {
            logMsg += ` ... RESULT: BUNDLE OPENED (${mysteryReveal.length} items)`;
        }
        window.dispatchEvent(new CustomEvent('adminEventLog', { detail: logMsg }));

        return { 
            success: true, 
            newBalance: state.money, 
            transaction: txnId,
            effectivePrice: effectivePrice,
            mysteryReveal: mysteryReveal
        };
    }

    static getSubcategoryByItemId(itemId) {
        const item = BLACK_MARKET_CONFIG.items.buffs.find(i => i.id === itemId);
        return item ? item.subCategory : null;
    }

    static calculateMysteryResult(itemId) {
        const tierId = itemId; // e.g. "mystery_standard"
        const tierConfig = MYSTERY_CONFIG.tiers[tierId];
        if (!tierConfig) return [{ type: 'empty', name: 'PACKAGE EMPTY' }];

        const rand = Math.random();
        if (rand < MYSTERY_CONFIG.emptyChance) {
            return [{ type: 'empty', name: 'PACKAGE EMPTY' }];
        }
        
        const bundles = tierConfig.bundles;
        if (!bundles || bundles.length === 0) return [{ type: 'empty', name: 'PACKAGE EMPTY' }];
        
        return bundles[Math.floor(Math.random() * bundles.length)];
    }

    static async applyAttack(attackerId, targetId, attackItem) {
        const targetState = await this.getTeamState(targetId);
        const timestamp = new Date().toISOString();
        
        let blocked = false;
        let reflected = false;
        let hidden = false;
        
        const findActive = (itemId) => targetState.activeEffects.findIndex(e => e.itemId === itemId);

        const hasShieldIndex = findActive('shield');
        const hasAntiNukeIndex = findActive('anti_nuke');
        const hasReflectorIndex = findActive('reflector');
        const hasHideoutIndex = findActive('hideout');

        if (hasHideoutIndex >= 0) {
            hidden = true;
        } else if (attackItem.id === 'nuke' && hasAntiNukeIndex >= 0) {
            blocked = true;
            targetState.activeEffects.splice(hasAntiNukeIndex, 1);
        } else if (hasReflectorIndex >= 0) {
            reflected = true;
            targetState.activeEffects.splice(hasReflectorIndex, 1);
        } else if (hasShieldIndex >= 0) {
            blocked = true;
            targetState.activeEffects.splice(hasShieldIndex, 1);
        }

        if (reflected) {
            const attackerState = await this.getTeamState(attackerId);
            attackerState.receivedAttacks.push({
                attackItem: attackItem.id,
                attackerId: targetId,
                timestamp: timestamp,
                status: 'reflected_back'
            });
            attackerState.eventLog.push({
                timestamp,
                text: `WARNING: Your attack on ${targetId.replace('TEAM_','TEAM ')} was REFLECTED back at you!`
            });
            await this.saveTeamState(attackerId, attackerState);
        }

        let status = 'hit';
        if (hidden) status = 'hidden';
        else if (blocked) status = 'blocked';
        else if (reflected) status = 'reflected';

        targetState.receivedAttacks.push({
            attackItem: attackItem.id,
            attackerId: attackerId,
            timestamp: timestamp,
            status: status
        });

        let logMsg = `ATTACKED by ${attackerId.replace('TEAM_','TEAM ')} with ${attackItem.name}`;
        if (blocked) logMsg += ` - BLOCKED by Defense`;
        else if (reflected) logMsg += ` - REFLECTED`;
        else if (hidden) logMsg += ` - EVADED via Hideout`;
        
        targetState.eventLog.push({
            timestamp,
            text: logMsg
        });

        await this.saveTeamState(targetId, targetState);
        return status;
    }

    static async deployItem(teamId, itemId, targetTeamId = null) {
        const state = await this.getTeamState(teamId);
        const itemConfig = BLACK_MARKET_CONFIG.items.buffs.find(i => i.id === itemId);
        if (!itemConfig) throw new Error("ITEM CONFIG NOT FOUND");
        
        const subCat = itemConfig.subCategory.toLowerCase();
        const inventoryList = state.inventory[subCat];
        const itemIndex = inventoryList.findIndex(i => i.itemId === itemId);
        
        if (itemIndex === -1) {
            throw new Error("ITEM NOT OWNED");
        }
        
        if (itemConfig.subCategory === "ATTACK") {
            if (!targetTeamId) throw new Error("TARGET REQUIRED");
            if (targetTeamId === teamId) throw new Error("CANNOT TARGET YOURSELF");
            const hasHideout = state.activeEffects.find(e => e.itemId === 'hideout');
            if (hasHideout) throw new Error("CANNOT ATTACK WHILE HIDEOUT IS ACTIVE");
        }
        
        inventoryList.splice(itemIndex, 1);
        const timestamp = new Date().toISOString();
        
        if (itemConfig.subCategory === "ATTACK") {
            const attackStatus = await this.applyAttack(teamId, targetTeamId, itemConfig);
            let resultText = `${teamId.replace('TEAM_', 'TEAM ')} launched ${itemConfig.name} at ${targetTeamId.replace('TEAM_', 'TEAM ')}`;
            if (attackStatus === 'blocked') resultText += ' - It was BLOCKED!';
            else if (attackStatus === 'reflected') resultText += ' - It was REFLECTED!';
            else if (attackStatus === 'hidden') resultText += ' - Target was HIDDEN!';
            
            state.eventLog.push({ timestamp, text: resultText });
        } else if (itemConfig.subCategory === "DEFENSE") {
            const alreadyActive = state.activeEffects.find(e => e.itemId === itemId);
            if (!alreadyActive || itemId === 'hideout') {
                state.activeEffects.push({ itemId, activatedAt: timestamp });
            }
            state.eventLog.push({ timestamp, text: `${teamId.replace('TEAM_', 'TEAM ')} activated ${itemConfig.name}` });
        } else {
            state.eventLog.push({ timestamp, text: `${teamId.replace('TEAM_', 'TEAM ')} used ${itemConfig.name}` });
        }
        
        await this.saveTeamState(teamId, state);
        return { success: true };
    }

    static async getAllTeams() {
        return ["TEAM_01", "TEAM_02", "TEAM_03", "TEAM_04", "TEAM_05", "TEAM_06", "TEAM_07", "TEAM_08", "TEAM_09", "TEAM_10", "TEAM_11", "TEAM_12", "TEAM_13", "TEAM_14"];
    }

    static async unlockBlackMarket(teamId) {
        const state = await this.getTeamState(teamId);
        state.blackMarketUnlocked = true;
        await this.saveTeamState(teamId, state);
    }

    static async recordCodeAttempt(teamId) {
        const state = await this.getTeamState(teamId);
        state.codeAttempts++;
        await this.saveTeamState(teamId, state);
        return state.codeAttempts;
    }

    static async revealItem(teamId, category, itemId) {
        const state = await this.getTeamState(teamId);
        const invCategory = category === 'buffs' ? 'attack' : category; // simplification for older hints logic
        const arr = state.inventory[invCategory] || state.inventory[category];
        const invItem = arr && arr.find(i => i.itemId === itemId);
        if (invItem) {
            invItem.revealed = true;
            await this.saveTeamState(teamId, state);
        }
    }
}
