const MARKET_CONFIG = {
    inflationRate: 0.05,
    minimumMultiplier: 1,
    maximumMultiplier: 3
};

const MYSTERY_CONFIG = {
    emptyChance: 0.07, // 7% chance
    tiers: {
        'mystery_standard': {
            bundles: [
                [{type: 'buff', itemId: 'task_redo', quantity: 2}, {type: 'hint', itemId: 'G1_H1', quantity: 1}],
                [{type: 'buff', itemId: 'shield', quantity: 1}, {type: 'buff', itemId: 'task_reroll', quantity: 1}],
                [{type: 'buff', itemId: 'bomb', quantity: 1}, {type: 'hint', itemId: 'FINAL_H1', quantity: 1}],
                [{type: 'decoy', itemId: 'receipt', name: 'OLD RECEIPT', quantity: 1}]
            ]
        },
        'mystery_classified': {
            bundles: [
                [{type: 'buff', itemId: 'bomb', quantity: 1}, {type: 'buff', itemId: 'task_reroll', quantity: 1}, {type: 'hint', itemId: 'G2_H1', quantity: 2}],
                [{type: 'buff', itemId: 'shield', quantity: 1}, {type: 'buff', itemId: 'sabotage', quantity: 1}, {type: 'hint', itemId: 'G1_H2', quantity: 1}],
                [{type: 'buff', itemId: 'task_redo', quantity: 2}, {type: 'buff', itemId: 'lockdown', quantity: 1}],
                [{type: 'decoy', itemId: 'corrupted', name: 'CORRUPTED FILE', quantity: 1}]
            ]
        },
        'mystery_restricted': {
            bundles: [
                [{type: 'buff', itemId: 'bomb', quantity: 2}, {type: 'buff', itemId: 'task_reroll', quantity: 1}, {type: 'hint', itemId: 'G3_MAJOR', quantity: 1}],
                [{type: 'buff', itemId: 'shield', quantity: 1}, {type: 'buff', itemId: 'anti_nuke', quantity: 1}, {type: 'hint', itemId: 'FINAL_H2', quantity: 2}],
                [{type: 'buff', itemId: 'reflector', quantity: 1}, {type: 'buff', itemId: 'sabotage', quantity: 2}],
                [{type: 'decoy', itemId: 'token', name: 'UNKNOWN TOKEN', quantity: 1}]
            ]
        },
        'mystery_black': {
            bundles: [
                [{type: 'buff', itemId: 'nuke', quantity: 1}, {type: 'buff', itemId: 'bomb', quantity: 2}, {type: 'hint', itemId: 'FINAL_MAJOR', quantity: 1}],
                [{type: 'buff', itemId: 'reflector', quantity: 1}, {type: 'buff', itemId: 'anti_nuke', quantity: 1}, {type: 'buff', itemId: 'shield', quantity: 2}],
                [{type: 'buff', itemId: 'nuke', quantity: 1}, {type: 'buff', itemId: 'sabotage', quantity: 1}, {type: 'hint', itemId: 'FINAL_GAME_CHANGING', quantity: 1}],
                [{type: 'decoy', itemId: 'broken_card', name: 'BROKEN ACCESS CARD', quantity: 1}]
            ]
        }
    }
};

const BLACK_MARKET_CONFIG = {
    currencySymbol: "₹",
    categories: ["hints", "buffs", "mystery"],
    initialTeamMoney: 5000,
    finalCode: {
        enabled: true
    },
    riddle: {
        enabled: true,
        title: "CLASSIFIED FILE // 01",
        text: `<span class="animated-riddle-line" style="animation-delay: 0s">Four secrets hide beyond your sight,</span>
<span class="animated-riddle-line" style="animation-delay: 1s">Spend your flame to bring them to light.</span>
<br>
<span class="animated-riddle-line" style="animation-delay: 2s">Find all of them, clear and true,</span>
<span class="animated-riddle-line" style="animation-delay: 3s">Ignore the decoys hiding among them too.</span>
<br>
<span class="animated-riddle-line" style="animation-delay: 4s">Choose the best four, then change their name,</span>
<span class="animated-riddle-line" style="animation-delay: 5s">The Professor speaks in ones and zeros again.</span>
<br>
<span class="animated-riddle-line" style="animation-delay: 6s">Convert each one, then leave it be,</span>
<span class="animated-riddle-line" style="animation-delay: 7s">Stack the four and add to find the key.</span>`
    },
    marketplace: {
        enabled: true
    },
    items: {
        hints: [
            { id: "G1_H1", gameId: "PHASE 2 // GAME 01", name: "HINT 01", tier: "minor", description: "A subtle clue regarding the intended approach.", basePrice: 400, maxPurchases: 1 },
            { id: "G1_H2", gameId: "PHASE 2 // GAME 01", name: "HINT 02", tier: "strong", description: "A stronger clue that narrows down the solution.", basePrice: 900, maxPurchases: 1 },

            { id: "G2_H1", gameId: "PHASE 2 // GAME 02", name: "HINT 01", tier: "minor", description: "Minor clue description...", basePrice: 400, maxPurchases: 1 },
            { id: "G2_H2", gameId: "PHASE 2 // GAME 02", name: "HINT 02", tier: "moderate", description: "Moderate clue description...", basePrice: 700, maxPurchases: 1 },
            { id: "G2_H3", gameId: "PHASE 2 // GAME 02", name: "HINT 03", tier: "strong", description: "Strong clue description...", basePrice: 1100, maxPurchases: 1 },

            { id: "G3_MAJOR", gameId: "PHASE 2 // GAME 03", name: "MAJOR HINT", tier: "major", description: "A high-value clue capable of significantly reducing the difficulty of the task.", basePrice: 1800, maxPurchases: 1 },

            { id: "FINAL_H1", gameId: "PHASE 2 // FINAL GAME", name: "HINT 01", tier: "minor", description: "Small clue...", basePrice: 500, maxPurchases: 1 },
            { id: "FINAL_H2", gameId: "PHASE 2 // FINAL GAME", name: "HINT 02", tier: "minor", description: "Small clue...", basePrice: 500, maxPurchases: 1 },
            { id: "FINAL_H3", gameId: "PHASE 2 // FINAL GAME", name: "HINT 03", tier: "moderate", description: "Moderate clue...", basePrice: 800, maxPurchases: 1 },
            { id: "FINAL_MAJOR", gameId: "PHASE 2 // FINAL GAME", name: "MAJOR HINT", tier: "major", description: "Significant strategic information...", basePrice: 2000, maxPurchases: 1 },
            { id: "FINAL_GAME_CHANGING", gameId: "PHASE 2 // FINAL GAME", name: "GAME-CHANGING HINT", tier: "gameChanging", description: "Extremely powerful information...", basePrice: 3500, maxPurchases: 1 }
        ],
        buffs: [
            // ATTACK
            { 
                id: "nuke", name: "NUCLEAR OPTION", description: "EXTREME ATTACK", subCategory: "ATTACK", basePrice: 3308, maxPurchases: 1, requiresTarget: true,
                fullDescription: "The most destructive weapon currently available on the Black Market. Select an opposing team and unleash a Nuclear Strike against their active task.\n\nEffect: Forces the target's current eligible task into the configured Nuclear Strike penalty, such as a forced task reroll or temporary task lock.",
                restrictions: { target: "One opposing team", consumable: "Yes", maxOwned: 1, canBeBlocked: "Yes" },
                strategicText: "Don't waste the strike. Make it count."
            },
            { 
                id: "bomb", name: "BOMB", description: "DELAYED ATTACK", subCategory: "ATTACK", basePrice: 1500, maxPurchases: Infinity, requiresTarget: true,
                fullDescription: "Plant a timed device on an opposing team's active task. The target must respond before the countdown expires.\n\nEffect: Starts a countdown on the target team. If successfully defused, no penalty occurs. If the target fails, the configured Bomb penalty is applied.",
                restrictions: { target: "One opposing team", consumable: "Yes", canBeBlocked: "Yes" },
                strategicText: "Pressure is sometimes more valuable than damage."
            },
            { 
                id: "sabotage", name: "SABOTAGE", description: "DISRUPT AN OPPONENT", subCategory: "ATTACK", basePrice: 1000, maxPurchases: Infinity, requiresTarget: true,
                fullDescription: "Interfere with an opposing team's next eligible task.\n\nEffect: Applies the configured Sabotage disadvantage to the target, such as reduced time, reduced attempts, or another predefined task restriction.",
                restrictions: { target: "One opposing team", consumable: "Yes", canBeBlocked: "Yes" },
                strategicText: "You don't have to beat them. Just make their job harder."
            },
            { 
                id: "lockdown", name: "LOCKDOWN", description: "TEMPORARY TASK DENIAL", subCategory: "ATTACK", basePrice: 1200, maxPurchases: Infinity, requiresTarget: true,
                fullDescription: "Temporarily shut down an opposing team's eligible task.\n\nEffect: The selected task becomes inaccessible for the configured duration. Other eligible activities remain available.",
                restrictions: { target: "One opposing team", consumable: "Yes", duration: "60 seconds", canBeBlocked: "Yes" },
                strategicText: "Sometimes the best attack is simply making them wait."
            },
            // DEFENSE
            { 
                id: "shield", name: "SHIELD", description: "ONE-TIME DEFENSE", subCategory: "DEFENSE", basePrice: 1000, maxPurchases: Infinity,
                fullDescription: "Deploy a permanent defensive shield around your team. The shield remains active until it successfully blocks one eligible attack.\n\nEffect: The next eligible attack against your team is completely blocked.\n\nAfter blocking: Shield is automatically consumed.\n\nImportant: Shield only blocks attacks that are configured as Shield-blockable. It does not necessarily block every possible future mechanic.",
                restrictions: { duration: "Permanent until triggered", consumable: "Yes", canBeBlocked: "N/A" },
                strategicText: "Buy it now. Forget about it. Let someone else take the risk."
            },
            { 
                id: "anti_nuke", name: "ANTI-NUKE", description: "NUCLEAR DEFENSE", subCategory: "DEFENSE", basePrice: 2000, maxPurchases: 1,
                fullDescription: "A specialized defensive system designed to neutralize one Nuclear Strike.\n\nEffect: The next eligible Nuclear Option targeting your team is completely blocked.\n\nAfter blocking: Anti-Nuke is consumed.",
                restrictions: { duration: "Permanent until triggered", consumable: "Yes", maxOwned: 1 },
                strategicText: "If someone is preparing the bomb, you should probably prepare the bunker."
            },
            { 
                id: "reflector", name: "REFLECTOR", description: "TURN THEIR ATTACK AGAINST THEM", subCategory: "DEFENSE", basePrice: 2500, maxPurchases: 1,
                fullDescription: "Deploy a reactive defense that redirects one eligible attack back toward the team that launched it.\n\nEffect: When an eligible attack targets your team, the attack is reflected back to the attacker.\n\nAfter activation: Reflector is consumed.",
                restrictions: { duration: "Permanent until triggered", consumable: "Yes", maxOwned: 1 },
                strategicText: "The safest attack is the one your enemy receives instead."
            },
            { 
                id: "hideout", name: "HIDEOUT", description: "TEMPORARY IMMUNITY", subCategory: "DEFENSE", basePrice: 1800, maxPurchases: Infinity,
                fullDescription: "Disappear from the battlefield temporarily.\n\nEffect: Your team cannot be targeted by eligible attacks while Hideout is active.\n\nRestriction: Your team also cannot launch eligible attacks while hidden.",
                restrictions: { duration: "Configurable timer", consumable: "Yes" },
                strategicText: "You can't be hunted if nobody can find you."
            },
            // UTILITY
            { 
                id: "task_reroll", name: "TASK REROLL", description: "ABANDON YOUR CURRENT TASK", subCategory: "UTILITY", basePrice: 800, maxPurchases: 2,
                fullDescription: "Discard your current eligible task and receive another one.\n\nEffect: Your current task is replaced with another task selected by the existing task system.\n\nImportant: This is NOT a free retry. You permanently give up the current task.",
                restrictions: { consumable: "Yes", maxOwned: 2 },
                strategicText: "Bad task? Maybe the next one is better. Maybe."
            },
            { 
                id: "task_redo", name: "TASK REDO", description: "ONE MORE SHOT", subCategory: "UTILITY", basePrice: 500, maxPurchases: 2,
                fullDescription: "Attempt the same eligible task again without replacing it.\n\nEffect: The task remains the same, but the team receives another permitted attempt according to the event's task rules.\n\nDifference: Reroll changes the task. Redo keeps the task.",
                restrictions: { consumable: "Yes", maxOwned: 2 },
                strategicText: "You know you can do better. Prove it."
            },
            // GAMBLE
            { 
                id: "double_or_nothing", name: "DOUBLE OR NOTHING", description: "RISK YOUR REWARD", subCategory: "GAMBLE", basePrice: 1000, maxPurchases: Infinity,
                fullDescription: "Put an earned reward on the line for a chance to double it.\n\nExample: Current reward ₹500, Required accuracy 80%.\nIf accuracy is 80% or higher → ₹1000.\nIf accuracy is below 80% → ₹0.\n\nThe participant must explicitly confirm before the gamble begins.",
                restrictions: { consumable: "Yes" },
                strategicText: "You already won. The question is whether you're brave enough to win twice."
            }
        ],
        mystery: [
            { 
                id: "mystery_standard", name: "SEALED BUNDLE", description: "MULTIPLE ITEMS", tier: "STANDARD", basePrice: 937, maxPurchases: Infinity,
                fullDescription: "A sealed mystery bundle containing multiple random items. Provides significantly better value than direct purchases, but with unpredictable contents.",
                restrictions: { consumable: "Yes", contents: "1-3 items" }, strategicText: "A cheap way to build an arsenal."
            },
            { 
                id: "mystery_classified", name: "SEALED BUNDLE", description: "MULTIPLE ITEMS", tier: "CLASSIFIED", basePrice: 1323, maxPurchases: Infinity,
                fullDescription: "A classified mystery bundle containing multiple items. Includes a higher chance for defensive utility and mid-tier hints.",
                restrictions: { consumable: "Yes", contents: "2-4 items" }, strategicText: "More reliable than standard, but still a gamble."
            },
            { 
                id: "mystery_restricted", name: "SEALED BUNDLE", description: "MULTIPLE ITEMS", tier: "RESTRICTED", basePrice: 2205, maxPurchases: Infinity,
                fullDescription: "A highly restricted mystery bundle. Likely to contain powerful offensive items, strong defenses, and high-value hints.",
                restrictions: { consumable: "Yes", contents: "3-4 items" }, strategicText: "High risk, high reward."
            },
            { 
                id: "mystery_black", name: "SEALED BUNDLE", description: "MULTIPLE ITEMS", tier: "BLACK", basePrice: 3308, maxPurchases: Infinity,
                fullDescription: "The ultimate mystery bundle. Contains the most devastating items on the market and game-changing intel. Highly volatile.",
                restrictions: { consumable: "Yes", contents: "3-5 items" }, strategicText: "If you have the money, why not?"
            }
        ]
    }
};

