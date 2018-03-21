'use strict';

(function() {
  const SEC_IN_DAY = 86400;
  const workingSpace = document.querySelector('#main');
  const adviserContainer = document.querySelector('#adviser-content-wrapper');
  const countdownContainer = document.querySelector('#countdown');
  const limitInputField = document.querySelector('#limit-field');
  const systemMessages = {
    expenseErrorTxt: 'Invalid value. Valid purchase amount is from 1 to 29999, purchase description field can\'t be empty ',
    limitErrorTxt: 'Invalid value. Valid limit: 1 to 29999. Valid period: 1 - 7 days ',
    messageType: {
      error: 'error-message-open',
      regular: 'regular-message-open'
    }
  };

  let secInPassedDays = 86400;
  let expense = 0;
  let countdownIsOn = countdownIsOn || false;
  let cycleEnded = cycleEnded || false;
  let initialLimit = localStorage.initialLimit || '';
  let currentLimit = localStorage.currentLimit || '';
  let startDeadLine = localStorage.startDeadLine || '';
  let deadLinePeriod = localStorage.deadLinePeriod || '';
  let endDeadLine = localStorage.endDeadLine || '';
  let expenseItems = localStorage.expenseItems || [];
  let messageHide = messageHide || '';
  let animateAdvise = animateAdvise || '';

  function uiState() {
    let btns = document.querySelectorAll('.btn');
    if(countdownIsOn) {
      // app in progress
      document.body.classList.add('in-process');
      btns.forEach((b) => {
        if(b.classList.contains('init-load-btn')) {
          b.disabled = true;
        } else {
          b.disabled = false;
        }
      });
    } else {
      // app is stopped
      document.body.classList.remove('in-process');
      btns.forEach((b) => {
        if(b.classList.contains('in-process-btn')) {
          b.disabled = true;
        } else {
          b.disabled = false;
        }
      });
    }
    if(parseInt(localStorage.currentLimit, 10) < 0) {
      limitInputField.classList.add('negative-balance');
    } else {
      limitInputField.classList.remove('negative-balance');
    }
  }

  function togglePopUp(popUpType, fn) {
    clearPopUpFields();
    if(workingSpace.classList.contains('pop-up-visible')) {
      workingSpace.classList.remove('pop-up-visible');
      let contents = workingSpace.children;
      if(contents.length) {
        for(let i = 0; i < contents.length; i++) {
          if(contents[i].classList.contains('pop-up')) {
            workingSpace.removeChild(contents[i]);
          }
        }
      }
    } else {
      fillPopUp(popUpType, fn);
      workingSpace.classList.add('pop-up-visible');
    }
    if(Simpl.cycleEnded) {
      Simpl.endCycle();
    }
  }

  function fillPopUp(popUpType, fn) {
    let popUpDiv = document.createElement('div');
    popUpDiv.classList.add('pop-up');
    popUpDiv.id = popUpType;
    if(popUpType === 'setlimit-pop-up') {
      popUpDiv.innerHTML =
      `<div class="pop-up__wrapper">
        <p class="pop-up__p">Set your day limit<br> 1 - 29999</p>
        <div class="pop-up__field-wrapper">
          <input type="number" class="pop-up__field" id="setlimit-field" min="1" max="29999" step="1" autofocus>
        </div>
        <p class="pop-up__p">Set a period<br> 1 - 7 (days)</p>
        <div class="pop-up__field-wrapper custom-range">
          <input type="range" id="deadline-range" min="1" max="7" step="1" value="1">
        </div>
        <div class="pop-up__field-wrapper">
          <input type="text" class="pop-up__field" id="deadline-range-output" value="1" readonly>
        </div>
        <div class="pop-up__controls">
          <button type="button" class="btn" id="setlimit-submit" data-pop-id="setlimit-pop-up" data-submit="ok">Ok</button>
          <button type="button" class="btn" id="setlimit-cancel" data-pop-id="setlimit-pop-up" data-submit="cancel">Cancel</button>
        </div>
      </div>`;
    }
    if(popUpType === 'rest-confirm-pop-up') {
      popUpDiv.innerHTML =
      `<div class="pop-up__wrapper">
        <p class="pop-up__p">Your progress will be lost. Continue?</p><br>
        <div class="pop-up__controls">
          <button type="button" class="btn" id="reset-confirm" data-pop-id="rest-confirm-pop-up" data-submit="ok">Ok</button>
          <button type="button" class="btn" id="reset-cancel" data-pop-id="rest-confirm-pop-up" data-submit="cancel">Cancel</button>
        </div>
      </div>`;
    }
    if(popUpType === 'setexpense-pop-up') {
      popUpDiv.innerHTML =
      `<div class="pop-up__wrapper">
        <p class="pop-up__p">Amount spent</p>
        <div class="pop-up__field-wrapper">
          <input type="number" class="pop-up__field" id="setexpense-value-field" min="1" max="29999" step="1" value="" autofocus>
        </div>
        <p class="pop-up__p">Purchase description</p>
        <div class="pop-up__field-wrapper">
          <input type="text" class="pop-up__field" maxlength="30" id="setexpense-name-field" value="">
        </div>
        <div class="pop-up__controls">
          <button type="button" class="btn" id="setexpense-submit" data-submit="ok">Ok</button>
          <button type="button" class="btn" id="setexpense-cancel" data-pop-id="setexpense-pop-up" data-submit="ok">Cancel</button>
        </div>
      </div>`;
    }
    workingSpace.appendChild(popUpDiv);
    if(fn) {
      fn();
    }
  }

  function clearPopUpFields() {
    let popUpFields = document.querySelectorAll('.pop-up__field');
    popUpFields.forEach((p) => {
      p.value = '';
    });
  }

  Simpl.prototype.setLimit = function() {
    let setlimitField = document.querySelector('#setlimit-field');
    let deadlineRange = document.querySelector('#deadline-range');
    this.cleanAdviser();
    initialLimit = parseInt(setlimitField.value, 10);
    deadLinePeriod = parseInt(deadlineRange.value, 10);
    if(deadLinePeriod < 1 || deadLinePeriod > 7 || initialLimit <= 0 || isNaN(initialLimit) || initialLimit > 29999) {
      this.showSystemMessage(systemMessages.limitErrorTxt, systemMessages.messageType['error'], 10000);
      return false;
    }
    limitInputField.value = initialLimit;
    localStorage.setItem('initialLimit', initialLimit);
    localStorage.setItem('secInPassedDays', secInPassedDays);
    this.setInitialTimer();
    setTimeout(function() {
      this.countdownWork();
      countdownContainer.style.display = 'block';
    }.bind(this), 1000);
    uiState();
    currentLimit = initialLimit;
    localStorage.setItem('currentLimit', currentLimit);
    return initialLimit;
  };

  Simpl.prototype.setInitialTimer = function() {
    startDeadLine = new Date();
    endDeadLine = new Date();
    endDeadLine.setDate(startDeadLine.getDate() + deadLinePeriod);
    localStorage.setItem('startDeadLine', startDeadLine);
    localStorage.setItem('endDeadLine', endDeadLine);
    localStorage.setItem('deadLinePeriod', deadLinePeriod);
    countdownIsOn = true;
  };

  Simpl.prototype.countdownWork = function() {
    if(!countdownIsOn) {
      countdownContainer.innerHTML = '';
    } else {
      let now = new Date();
      now = Math.floor((endDeadLine - now) / 1000);
      if(now <= 0) {
        // additional checking
        // while current passed time is less than deadline period
        // and current limit += initial limit is less than maximum available sum
        // renew balance
        while( parseInt(localStorage.secInPassedDays, 10) < (deadLinePeriod * SEC_IN_DAY) &&
          parseInt(localStorage.currentLimit, 10) + parseInt(localStorage.initialLimit, 10) < parseInt(localStorage.initialLimit, 10) * deadLinePeriod ) {
          this.renewLimit(parseInt(localStorage.initialLimit, 10));
          localStorage.setItem('secInPassedDays', secInPassedDays);
        }
        countdownIsOn = false;
        cycleEnded = true;
        countdownContainer.style.display = '';
        this.endCycle();
        return false;
      }
      if( ((deadLinePeriod * SEC_IN_DAY) - now) > parseInt(localStorage.secInPassedDays, 10) && now > 0 ) {
        this.renewLimit(parseInt(localStorage.initialLimit, 10));
        secInPassedDays = parseInt(localStorage.secInPassedDays, 10);
        secInPassedDays += SEC_IN_DAY;
        localStorage.setItem('secInPassedDays', secInPassedDays);
      }
      let tsec = now % 60;
      now = Math.floor(now / 60);
      if(tsec < 10) {
        tsec = '0' + tsec;
      }
      let tmin = now % 60;
      now = Math.floor(now / 60);
      if(tmin < 10) {
        tmin = '0' + tmin;
      }
      let thour = now % (24 * deadLinePeriod);
      now = Math.floor(now / 24);
      if(thour < 10) {
        thour = '0' + thour;
      }
      countdownContainer.innerHTML = `${thour}:${tmin}:${tsec}`;
      setTimeout(function() {
        this.countdownWork();
      }.bind(this), 1000);
    }
    return true;
  };

  Simpl.prototype.limitSubtract = function() {
    let setExpenseValueField = document.querySelector('#setexpense-value-field');
    let setExpenseNameField = document.querySelector('#setexpense-name-field');
    expense = parseInt(setExpenseValueField.value, 10);
    if(Number.isInteger(expense) && expense > 0 && expense < 30000 && setExpenseNameField.value) {
      currentLimit = localStorage.currentLimit || initialLimit;
      currentLimit -= expense;
      localStorage.setItem('currentLimit', currentLimit);
      limitInputField.value = currentLimit;
      let expenseObj = {
        name: setExpenseNameField.value,
        price: expense
      };
      this.addExpenseItem(expenseObj);
      uiState();
      // this.showCurrentSpent(expense);
      if(currentLimit < -30000) {
        countdownIsOn = false;
        cycleEnded = true;
        return 'Limit is exceeded';
      }
      return currentLimit;
    } else {
      this.showSystemMessage(systemMessages.expenseErrorTxt, systemMessages.messageType['error'], 10000);
      return false;
    }
  };

  Simpl.prototype.addExpenseItem = function(item) {
    if(localStorage.expenseItems) {
      expenseItems = JSON.parse(localStorage.expenseItems);
    }
    let expenseItem = {
      name: item.name,
      price: item.price
    };
    if(expenseItems.length >= 3) {
      expenseItems.pop();
    }
    expenseItems.unshift(expenseItem);
    localStorage.setItem('expenseItems', JSON.stringify(expenseItems));
    this.showExpenseList();
  };

  Simpl.prototype.showExpenseList = function() {
    this.cleanAdviser();
    let isEmpty = true;
    if(localStorage.expenseItems) {
      expenseItems = JSON.parse(localStorage.expenseItems);
      isEmpty = false;
    }
    if(!isEmpty) {
      let expenseList = document.createElement('ul');
      expenseList.classList.add('expense-list');
      adviserContainer.appendChild(expenseList);
      expenseList.innerHTML = expenseItems.map((i) => {
        return `<li class="expense-list__item">${i.name}<span class="expense-list__cash">${i.price}</span></li>`;
      }).join('');
      let listItems = document.querySelectorAll('.expense-list__item');
      let defaultPadding = 12;
      listItems.forEach((l) => {
        l.style.paddingRight = l.children[0].offsetWidth + (defaultPadding * 2) + 'px';
      });
    }
  };

  // Simpl.prototype.showCurrentSpent = function(spentSum) {
  //   let sum = +localStorage.currentSpent || 0;
  //   sum += spentSum;
  //   let currSpentContainer;
  //   if(currSpentContainer) {
  //     currSpentContainer.innerHTML = `Потрачено за день: ${sum}`;
  //   } else {
  //     currSpentContainer = document.createElement('div');
  //     currSpentContainer.id = 'spent';
  //     currSpentContainer.innerHTML = `Потрачено за день: ${sum}`;
  //     document.querySelector('.container--main').appendChild(currSpentContainer);
  //     localStorage.setItem('currentSpent', sum);
  //   }
  // };

  Simpl.prototype.init = function() {
    if(localStorage.length) { // app is working - data in localstorage
      startDeadLine = new Date(Date.parse(localStorage.startDeadLine));
      endDeadLine = new Date(Date.parse(localStorage.endDeadLine));
      deadLinePeriod = localStorage.deadLinePeriod;
      secInPassedDays = localStorage.secInPassedDays;
      countdownIsOn = true;
      this.countdownWork();
      this.showExpenseList();
      limitInputField.value = currentLimit;
      clearTimeout(showTimer);
      let showTimer = setTimeout(function() {
        countdownContainer.style.display = 'block';
      }, 1000);
    }
    if(localStorage.currentLimit && localStorage.currentLimit < -30000) {
      countdownIsOn = false;
      cycleEnded = true;
      this.endCycle();
    }
    uiState();
  };

  Simpl.prototype.renewLimit = function(sum) {
    currentLimit = parseInt(localStorage.currentLimit, 10) || parseInt(localStorage.initialLimit, 10);
    currentLimit += sum;
    limitInputField.value = currentLimit;
    localStorage.setItem('currentLimit', currentLimit);
    uiState();
  };

  Simpl.prototype.endCycle = function() {
    clearPopUpFields();
    let endDiv = document.createElement('div');
    endDiv.classList.add('pop-up');
    endDiv.innerHTML =
    `<div class="pop-up__wrapper">
      <div id="end-verdict"></div>
      <div id="end-stat"></div>
      <div class="pop-up__controls">
        <button type="button" class="btn" id="final-reset" data-pop-id="end-pop-up" data-submit="ok">Ok</button>
      </div>
    </div>`;
    workingSpace.appendChild(endDiv);
    workingSpace.classList.add('pop-up-visible');
    this.loadStat();
  };

  Simpl.prototype.resetAll = function() {
    countdownIsOn = false;
    cycleEnded = false;
    this.cleanAdviser();
    initialLimit = '';
    currentLimit = '';
    startDeadLine = '';
    endDeadLine = '';
    deadLinePeriod = '';
    expenseItems = [];
    limitInputField.value = '';
    localStorage.clear();
    uiState();
    let popUps = document.querySelectorAll('.pop-up');
    popUps.forEach((p) => {
      p.style.display = '';
    });
    secInPassedDays = 86400;
  };

  Simpl.prototype.loadStat = function() {
    let endVerdict = document.querySelector('#end-verdict');
    let endStat = document.querySelector('#end-stat');
    initialLimit = parseInt(localStorage.initialLimit, 10);
    currentLimit = parseInt(localStorage.currentLimit, 10);
    deadLinePeriod = parseInt(localStorage.deadLinePeriod, 10);
    limitInputField.value = currentLimit;
    if(!currentLimit || currentLimit > -30000) {
      endVerdict.innerHTML = `<p>Time is up</p>`;
    } else {
      endVerdict.innerHTML = `<p>Purchase limit exceeded</p>`;
    }
    if(!currentLimit || currentLimit === initialLimit * deadLinePeriod) {
      endStat.innerHTML =
      `<p>Day limit: ${initialLimit}</p>
      <p>Period (days): ${deadLinePeriod}</p> //посчитать количество прошедших (secInPassedDays) если оно не совпадает с изначально заданным
      <p>Spent: 0</p>
      <p>Saved: ${initialLimit}</p>
      <p>Probably you did it wrong or didn&#39;t write down your purchases. Try again.</p>`;
    } else if(currentLimit < 0) {
      endStat.innerHTML =
      `<p>Day limit: ${initialLimit}</p>
      <p>Period (days): ${deadLinePeriod}</p>
      <p>Spent: ${((initialLimit * deadLinePeriod) + Math.abs(currentLimit))}</p>
      <p>Overspent: ${Math.abs(currentLimit)}</p>
      <p>Try again.</p>`;
    } else {
      endStat.innerHTML =
      `<p>Day limit: ${initialLimit}</p>
      <p>Period (days): ${deadLinePeriod}</p>
      <p>Spent: ${((initialLimit * deadLinePeriod) - currentLimit)}</p>
      <p>Saved: ${currentLimit}</p>
      <p>Try again.</p>`;
    }
  };

  Simpl.prototype.cleanAdviser = function() {
    clearInterval(animateAdvise);
    clearTimeout(messageHide);
    adviserContainer.innerHTML = '';
    adviserContainer.className = '';
    adviserContainer.classList.add('adviser__wrapper');
  };

  Simpl.prototype.showSystemMessage = function(systemMessageText, messageType) {
    let i = 0;
    let blinkingCursor = `<span class="blinking-cursor">&nbsp;</span>`;
    let speed = 30;
    this.cleanAdviser();
    animateAdvise = setInterval(function() {
      adviserContainer.innerHTML += systemMessageText[i];
      i++;
      if(i === systemMessageText.length) {
        clearInterval(animateAdvise);
        adviserContainer.innerHTML += blinkingCursor;
        adviserContainer.classList.add(messageType);
      }
    }, speed);
    messageHide = setTimeout(function() {
      this.cleanAdviser();
      this.showExpenseList();
    }.bind(this), 8000);
  };

  function Simpl() {
    window.addEventListener('click', function(evt) {
      let id = evt.target.id;
      let isBtn = evt.target.classList.contains('btn');
      let popUpType = evt.target.dataset.popId;
      if(!isBtn) {
        return;
      }
      // clicks
      if(id === 'final-reset' || id === 'reset-confirm') {
        this.resetAll();
        togglePopUp(popUpType);
      } else if(id === 'setlimit-submit') {
        this.setLimit();
        togglePopUp(popUpType);
      } else if(id === 'setexpense-submit') {
        this.limitSubtract();
        if(!Simpl.cycleEnded) {
          togglePopUp(popUpType);
        }
      } else if(id === 'set-limit-btn') {
        togglePopUp(popUpType, function() {
          let rangeSlider = document.querySelector('#deadline-range');
          let rangeOutput = document.querySelector('#deadline-range-output');
          rangeSlider.addEventListener('input', function() {
            rangeOutput.value = rangeSlider.value;
          });
        });
      } else {
        togglePopUp(popUpType);
      }
    }.bind(this));
    this.init();
  }

  return new Simpl();
})();
