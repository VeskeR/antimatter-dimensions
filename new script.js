// setInverval wrapper using Worker API to prevent slowing down while in background
var workerTimer;
(function () {
    var workerContentBlob = new Blob([`var intervalIds = {};
    self.onmessage = function(e) {
        switch (e.data.command) {
            case 'interval:start':
                var intvalId = setInterval(function() {
                    postMessage({
                        message: 'interval:tick',
                        id: e.data.id
                    });
                }, e.data.interval);
                postMessage({
                    message: 'interval:started',
                    id: e.data.id
                });
                intervalIds[e.data.id] = intvalId;
                break;
            case 'interval:clear':
                clearInterval(intervalIds[e.data.id]);
                postMessage({
                    message: 'interval:cleared',
                    id: e.data.id
                });
                delete intervalIds[e.data.id];
                break;
        }
    };`], { type: "text/javascript" });

    var worker = new Worker(window.URL.createObjectURL(workerContentBlob));

    workerTimer = {
        id: 0,
        callbacks: {},
        setInterval: function (cb, interval, context) {
            this.id++;
            var id = this.id;
            this.callbacks[id] = { fn: cb, context: context };
            worker.postMessage({
                command: 'interval:start',
                interval: interval,
                id: id
            });
            return id;
        },
        onMessage: function (e) {
            switch (e.data.message) {
                case 'interval:tick':
                    var callback = this.callbacks[e.data.id];
                    if (callback && callback.fn) callback.fn.apply(callback.context);
                    break;
                case 'interval:cleared':
                    delete this.callbacks[e.data.id];
                    break;
            }
        },
        clearInterval: function (id) {
            worker.postMessage({ command: 'interval:clear', id: id });
        }
    };

    worker.onmessage = workerTimer.onMessage.bind(workerTimer);
})();

// ----------
// Antimatter Dimensions AI

var currentInvervals = [];
var activeAIsDefault = {
    MaxAll: false,
    Sacrifice: false,
    DimensionBoost: false,
    AntimatterGalaxy: false,
    BigCrunch: false,
};
var activeAIs = { ...activeAIsDefault };

function startAIMaxAll() {
    var interval = workerTimer.setInterval(() => {
        document.getElementById("maxall").click();
    }, AISystemConfig.delay);
    currentInvervals.push(interval);
    activeAIs.MaxAll = true;
}

function startAISacrifice() {
    var interval = workerTimer.setInterval(() => {
        var eightAmount = /^(.*)\s\(.*\)$/.exec(document.getElementById("eightAmount").innerHTML)[1];
        var sacrificeMultiplier = +/\((.*)x\)$/.exec(document.getElementById("sacrifice").innerHTML)[1];

        if (eightAmount !== '0' && sacrificeMultiplier >= AIConfig.sacrificeMultiplierThreshold) {
            document.getElementById("sacrifice").click();
        }
    }, AISystemConfig.delay);
    currentInvervals.push(interval);
    activeAIs.Sacrifice = true;
}

function startAIDimensionBoost() {
    var interval = workerTimer.setInterval(() => {
        // don't Dimension Boost if Antimatter Galaxy AI is enabled, it is allowed by configs, and it AG costs less or equal to DB
        var antimatterGalaxyAIActive = activeAIs.AntimatterGalaxy;
        var antimatterGalaxyPriceBetter = getAntimatterGalaxyCost() <= getDimensionBoostCost();
        var antimatterGalaxyShouldDo = shouldDoAntimatterGalaxy();

        if (antimatterGalaxyAIActive && antimatterGalaxyPriceBetter && antimatterGalaxyShouldDo) {
            return;
        }

        var currentBoost = +/^Dimension (Shift|Boost) \((.*)\)/.exec(document.getElementById("resetLabel").innerHTML)[2];
        if (getCurrentAntimatterGalaxies() >= AIConfig.galaxiesRequiredForDimensionBoost && currentBoost < AIConfig.maxDimensionBoost) {
            document.getElementById("softReset").click();
        }
    }, AISystemConfig.delay);
    currentInvervals.push(interval);
    activeAIs.DimensionBoost = true;
}

function startAIAntimatterGalaxy() {
    var interval = workerTimer.setInterval(() => {
        if (shouldDoAntimatterGalaxy()) {
            document.getElementById("secondSoftReset").click();
        }
    }, AISystemConfig.delay);
    currentInvervals.push(interval);
    activeAIs.AntimatterGalaxy = true;
}

function startAIBigCrunch() {
    var interval = workerTimer.setInterval(() => {
        document.getElementById("bigcrunch").click();
    }, AISystemConfig.delay);
    currentInvervals.push(interval);
    activeAIs.BigCrunch = true;
}

function getDimensionBoostCost() {
    var dimensionBoostCost = +/^Dimension.*requires (\d+).* Dimensions$/.exec(document.getElementById("resetLabel").innerHTML)[1];
    return dimensionBoostCost;
}

function getAntimatterGalaxyCost() {
    var antimatterGalaxyCost = +/^Antimatter Galaxies.*requires (\d+).* Dimensions$/.exec(document.getElementById("secondResetLabel").innerHTML)[1];
    return antimatterGalaxyCost;
}

function shouldDoAntimatterGalaxy() {
    return getCurrentAntimatterGalaxies() < AIConfig.maxAntimatterGalaxies;
}

function getCurrentAntimatterGalaxies() {
    var currentGalaxies = +/^Antimatter Galaxies \((\d+).*?\)/.exec(document.getElementById("secondResetLabel").innerHTML)[1];
    return currentGalaxies;
}

function startAIDefault() {
    setAIConfig(AIType.DEFAULT);

    startAIMaxAll();
    startAISacrifice();
    startAIDimensionBoost();
    startAIAntimatterGalaxy();
    startAIBigCrunch();
}

function startAIC8() {
    setAIConfig(AIType.C8);

    startAIMaxAll();
    startAISacrifice();
    startAIDimensionBoost();
    startAIBigCrunch();
}

function startAIInfinity() {
    setAIConfig(AIType.INFINITY);

    startAIMaxAll();
    startAIDimensionBoost();
}

function stopAI() {
    currentInvervals.forEach(x => workerTimer.clearInterval(x));
    currentInvervals = [];
    activeAIs = { ...activeAIsDefault };
}

function getAIConfigForType(aiType) {
    return {
        ...AIConfigPresets._base,
        ...AIConfigPresets[aiType],
    };
}

function setAIConfig(aiType) {
    AIConfig = getAIConfigForType(aiType);
}

var AIType = {
    DEFAULT: 'DEFAULT',
    C8: 'C*',
    INFINITY: 'INFINITY',
};

var AIConfigPresets = {
    _base: {
        maxAntimatterGalaxies: 9,
        sacrificeMultiplierThreshold: 50000,
        maxDimensionBoost: Number.POSITIVE_INFINITY,
        galaxiesRequiredForDimensionBoost: 8,
    },
    [AIType.DEFAULT]: {
        maxAntimatterGalaxies: 9,
        sacrificeMultiplierThreshold: 50000,
        maxDimensionBoost: Number.POSITIVE_INFINITY,
        galaxiesRequiredForDimensionBoost: 8,
    },
    [AIType.C8]: {
        maxAntimatterGalaxies: 0,
        sacrificeMultiplierThreshold: 2.5,
        maxDimensionBoost: 5,
        galaxiesRequiredForDimensionBoost: 8,
    },
    [AIType.INFINITY]: {
        maxAntimatterGalaxies: 100000,
        maxDimensionBoost: Number.POSITIVE_INFINITY,
        galaxiesRequiredForDimensionBoost: 43,
    },
};

var AIConfig = { ...AIConfigPresets._base };
var AISystemConfig = {
    delay: 30,
};
