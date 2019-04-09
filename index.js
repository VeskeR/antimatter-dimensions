function forceStop() {
  if (window.ad && window.ad.stop && typeof window.ad.stop === 'function') {
    window.ad.stop();
  }
}

function init(inputOpts) {
  forceStop();

  async function wait(num) {
    return new Promise((resolve) => setTimeout(resolve, num));
  }

  const defaultOpts = {
    dimensionShiftBoostMax: Infinity,
    antimatterGalaxyMax: Infinity,
    sacrificeDimensionPercentCheck: 7,
    isSacrificeEfficient: (percent, bonus) => {
      return (percent >= 64 && bonus >= 1.25) ||
        (percent >= 32 && bonus >= 1.3) ||
        (percent >= 16 && bonus >= 1.4) ||
        (percent >= 8 && bonus >= 1.5) ||
        (percent >= 4 && bonus >= 1.75) ||
        (percent >= 2 && bonus >= 2) ||
        (percent >= 1.5 && bonus >= 3) ||
        bonus >= 4;
    },
    progressCallDelay: 50,
    maxAllCallDelay: 5,
    upgradeCallDelay: 5,
    useBuyMax: true,
    useBuyOne: true,
    buyDimensions: [1, 2, 3, 4, 5, 6, 7, 8]
  };

  let opts = { ...defaultOpts };

  const ad = {
    upgrade: {
      canUseMaxAll: true,
      maxAll: $('#maxall'),
      tickSpeed: $('#tickSpeed'),
      dimensions: {
        percentRegExp: /\(([+-])(\d+\.?\d+)(e(\d+))?%\/s\)/,
        get: function (dimension) {
          return this.list[dimension - 1];
        },
        add: function (row, name, amount, buyOne, buyMax) {
          const $row = $(row);
          const $name = $(name);
          const $amount = $(amount);
          const $buyOne = $(buyOne);
          const $buyMax = $(buyMax);
          this.list.push({
            row: $row,
            name: $name,
            amount: $amount,
            buyOne: $buyOne,
            buyMax: $buyMax,
            isActive: () => $row.css('display') !== 'none',
            getPercent: () => {
              const res = ad.upgrade.dimensions.percentRegExp.exec($amount.text());
              if (res && res[1] && res[2]) {
                const integral = res[1] === '-' ? +res[2] * -1 : +res[2];
                if (res[3] && res[4]) {
                  return integral * 10 ** +res[4];
                } else {
                  return integral;
                }
              } else {
                return null;
              }
            }
          });
        },
        upgrade: async function () {
          if (opts.useBuyOne) {
            for (let i = 0; i < opts.buyDimensions.length; i++) {
              const dimension = this.get(opts.buyDimensions[i]);
              if (dimension.isActive()) {
                while (dimension.buyOne.hasClass('storebtn')) {
                  dimension.buyOne.click();
                  await wait(0);
                }
              }
            }
          }
        },
        maxAll: async function () {
          for (let i = 0; i < opts.buyDimensions.length; i++) {
            const dimension = this.get(opts.buyDimensions[i]);
            if (dimension.isActive()) {
              dimension.buyMax.click();
            }
          }
        },
        list: []
      },
      sacrifice: {
        button: $('#sacrifice'),
        confirm: $('#confirmation'),
        sacrificeBonusRegExp: /\((\d+\.?\d+)(e(\d+))?x\)/,
        isActive: function () {
          return this.button.css('display') !== 'none' && !this.button.hasClass('unavailablebtn');
        },
        getBonus: function () {
          const res = this.sacrificeBonusRegExp.exec(this.button.text());
          if (res && res[1]) {
            const integral = +res[1];
            if (res[2] && res[3]) {
              return integral * 10 ** +res[3];
            } else {
              return integral;
            }
          } else {
            return null;
          }
        },
        sacrifice: function () {
          if (this.isActive()) {
            const percent = ad.upgrade.dimensions.get(opts.sacrificeDimensionPercentCheck).getPercent();
            const bonus = this.getBonus();
            if (percent && bonus && opts.isSacrificeEfficient(percent, bonus)) {
              this.confirm.prop('checked', true);
              this.button.click();
              console.log(`Dimensional sacrifice at: percent=${percent}, bonus=${bonus}`);
            }
          }
        }
      }
    },
    progress: {
      dimensionShiftBoost: {
        label: $('#resetLabel'),
        button: $('#softReset'),
        countRegExp: /\((\d+)\):/,
        isActive: function () {
          return !this.button.hasClass('unavailablebtn');
        },
        getCount: function () {
          const res = this.countRegExp.exec(this.label.text());
          if (res && res[1]) {
            return +res[1];
          }
        },
        do: function () {
          if (this.isActive() && this.getCount() < opts.dimensionShiftBoostMax) {
            console.log(`Performing dimension shift / boost. New count: ${this.getCount() + 1}`);
            this.button.click();
          }
        }
      },
      antimatterGalaxy: {
        label: $('#secondResetLabel'),
        button: $('#secondSoftReset'),
        countRegExp: /\((\d+)\):/,
        isActive: function () {
          return !this.button.hasClass('unavailablebtn');
        },
        getCount: function () {
          const res = this.countRegExp.exec(this.label.text());
          if (res && res[1]) {
            return +res[1];
          }
        },
        do: function () {
          if (this.isActive() && this.getCount() < opts.antimatterGalaxyMax) {
            console.log(`Buying antimatter galaxy. New count: ${this.getCount() + 1}`);
            this.button.click();
          }
        }
      },
      bigCrunch: {
        button: $('#bigcrunch'),
        isActive: function () {
          return this.button.css('display') !== 'none';
        },
        do: function () {
          if (this.isActive()) {
            console.log('Performing Big Crunch');
            this.button.click();
          }
        }
      }
    },
    resetOpts: function () {
      opts = { ...defaultOpts };
      opts.buyDimensions.sort((a, b) => b - a);
    },
    setOpts: function (newOpts) {
      opts = { ...opts, ...newOpts };
      opts.buyDimensions.sort((a, b) => b - a);
      if (opts.buyDimensions.length < 8) {
        this.upgrade.canUseMaxAll = false;
      } else {
        this.upgrade.canUseMaxAll = true;
      }
    },
    start: function () {
      this.shouldStop = false;

      function progress() {
        if (ad.shouldStop) {
          ad.progressTimeout = null;
          return;
        }

        ad.progress.bigCrunch.do();
        ad.progress.antimatterGalaxy.do();
        ad.progress.dimensionShiftBoost.do();
        ad.upgrade.sacrifice.sacrifice();

        ad.progressTimeout = setTimeout(progress, opts.progressCallDelay);
      }

      function maxAll() {
        if (ad.shouldStop) {
          ad.maxAllTimeout = null;
          return;
        }

        if (ad.upgrade.canUseMaxAll && opts.useBuyMax) {
          ad.upgrade.maxAll.click();
        } else {
          ad.upgrade.tickSpeed.click();
          ad.upgrade.dimensions.maxAll();
        }
        ad.maxAllTimeout = setTimeout(maxAll, opts.maxAllCallDelay);
      }

      async function upgrade() {
        if (ad.shouldStop) {
          ad.upgradeTimeout = null;
          return;
        }

        await ad.upgrade.dimensions.upgrade();
        ad.upgradeTimeout = setTimeout(upgrade, opts.upgradeCallDelay);
      }

      progress();
      maxAll();
      upgrade();
    },
    stop: function () {
      this.shouldStop = true;
      if (!!this.progressTimeout) {
        clearTimeout(this.progressTimeout);
        this.progressTimeout = null;
      }
      if (!!this.maxAllTimeout) {
        clearTimeout(this.maxAllTimeout);
        this.maxAllTimeout = null;
      }
      if (!!this.upgradeTimeout) {
        clearTimeout(this.upgradeTimeout);
        this.upgradeTimeout = null;
      }
    },
    progressTimeout: null,
    maxAllTimeout: null,
    upgradeTimeout: null,
    shouldStop: false
  };

  ad.setOpts(inputOpts);

  [
    { row: '#firstRow', name: '#firstD', amount: '#firstAmount', buyOne: '#first', buyMax: '#firstMax' },
    { row: '#secondRow', name: '#secondD', amount: '#secondAmount', buyOne: '#second', buyMax: '#secondMax' },
    { row: '#thirdRow', name: '#thirdD', amount: '#thirdAmount', buyOne: '#third', buyMax: '#thirdMax' },
    { row: '#fourthRow', name: '#fourthD', amount: '#fourthAmount', buyOne: '#fourth', buyMax: '#fourthMax' },
    { row: '#fifthRow', name: '#fifthD', amount: '#fifthAmount', buyOne: '#fifth', buyMax: '#fifthMax' },
    { row: '#sixthRow', name: '#sixthD', amount: '#sixthAmount', buyOne: '#sixth', buyMax: '#sixthMax' },
    { row: '#seventhRow', name: '#seventhD', amount: '#seventhAmount', buyOne: '#seventh', buyMax: '#seventhMax' },
    { row: '#eightRow', name: '#eightD', amount: '#eightAmount', buyOne: '#eight', buyMax: '#eightMax' }
  ].forEach(v => ad.upgrade.dimensions.add(v.row, v.name, v.amount, v.buyOne, v.buyMax));

  window.ad = ad;
}

forceStop();
init({
  dimensionShiftBoostMax: Infinity,
  antimatterGalaxyMax: 1,
  sacrificeDimensionPercentCheck: 7,
  isSacrificeEfficient: (percent, bonus) => {
    return (percent >= 64 && bonus >= 1.25) ||
      (percent >= 32 && bonus >= 1.3) ||
      (percent >= 16 && bonus >= 1.4) ||
      (percent >= 8 && bonus >= 1.5) ||
      (percent >= 4 && bonus >= 1.75) ||
      (percent >= 2 && bonus >= 2) ||
      (percent >= 1.5 && bonus >= 3) ||
      bonus >= 4;
  },
  progressCallDelay: 50,
  maxAllCallDelay: 5,
  upgradeCallDelay: 5,
  useBuyMax: true,
  useBuyOne: true,
  buyDimensions: [1, 2, 3, 4, 5, 6, 7, 8]
});
