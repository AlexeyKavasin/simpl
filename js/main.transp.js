'use strict';

var simpl = {
  SEC_IN_DAY: 86400,
  secInPassedDays: 86400,
  countdownIsOn: this.countdownIsOn || false,
  cycleEnded: this.cycleEnded || false,
  expense: 0,
  initialLimit: localStorage.initialLimit || this.initialLimit || '',
  currentLimit: localStorage.currentLimit || this.currentLimit || '',
  startDeadLine: localStorage.startDeadLine || this.startDeadLine || '',
  deadLinePeriod: localStorage.deadLinePeriod || this.deadLinePeriod || '',
  endDeadLine: localStorage.endDeadLine || this.endDeadLine || '',
  expenseItems: localStorage.expenseItems || this.expenseItems || [],

  // DOM elements
  workingSpace: document.querySelector('#main'),
  adviserContainer: document.querySelector('#adviser-content-wrapper'),
  countdownContainer: document.querySelector('#countdown'),
  limitInputField: document.querySelector('#limit-field'),

  // timers for message animation
  messageHide: this.messageHide || '',
  animateAdvise: this.animateAdvise || '',

  // adding listeners
  addListeners: function addListeners() {
    var self = simpl;
    self.workingSpace.addEventListener('click', self.btnAction);
  },

  // setting limit
  setLimit: function setLimit() {
    var setlimitField = document.querySelector('#setlimit-field');
    var deadlineRange = document.querySelector('#deadline-range');
    this.cleanAdviser();
    this.initialLimit = parseInt(setlimitField.value, 10);
    this.deadLinePeriod = parseInt(deadlineRange.value, 10);
    if (this.deadLinePeriod < 1 || this.deadLinePeriod > 7 || this.initialLimit < 0 || isNaN(this.initialLimit) || this.initialLimit > 99999) {
      this.showSystemMessage(this.systemMessages.limitErrorTxt, this.systemMessages.messageType['error'], 10000);
      return 'Invalid value';
    }
    this.limitInputField.value = this.initialLimit;
    localStorage.setItem('initialLimit', this.initialLimit);
    localStorage.setItem('secInPassedDays', this.secInPassedDays);
    this.setInitialTimer();
    setTimeout(function () {
      this.countdownWork();
      this.countdownContainer.style.display = 'block';
    }.bind(this), 1000);
    this.controlsState();
    this.currentLimit = this.initialLimit;
    localStorage.setItem('currentLimit', this.currentLimit);
    return this.initialLimit;
  },

  // setting timer
  setInitialTimer: function setInitialTimer() {
    this.startDeadLine = new Date();
    this.endDeadLine = new Date();
    this.endDeadLine.setDate(this.startDeadLine.getDate() + this.deadLinePeriod);
    localStorage.setItem('startDeadLine', this.startDeadLine);
    localStorage.setItem('endDeadLine', this.endDeadLine);
    localStorage.setItem('deadLinePeriod', this.deadLinePeriod);
    this.countdownIsOn = true;
  },

  // timer working
  countdownWork: function countdownWork() {
    if (!this.countdownIsOn) {
      this.countdownContainer.innerHTML = '';
    } else {
      var now = new Date();
      now = Math.floor((this.endDeadLine - now) / 1000);
      if (now <= 0) {
        // additional checking
        // while current passed time is less than deadline period
        // and current limit += initial limit is less than maximum available sum
        // renew balance
        while (parseInt(localStorage.secInPassedDays, 10) < this.deadLinePeriod * this.SEC_IN_DAY && parseInt(localStorage.currentLimit, 10) + parseInt(localStorage.initialLimit, 10) < parseInt(localStorage.initialLimit, 10) * this.deadLinePeriod) {
          this.renewLimit(parseInt(localStorage.initialLimit, 10));
          localStorage.setItem('secInPassedDays', this.secInPassedDays);
        }
        this.countdownIsOn = false;
        this.cycleEnded = true;
        this.endCycle();
        this.countdownContainer.style.display = '';
        return false;
      }
      if (this.deadLinePeriod * this.SEC_IN_DAY - now > parseInt(localStorage.secInPassedDays, 10) && now > 0) {
        this.renewLimit(parseInt(localStorage.initialLimit, 10));
        this.secInPassedDays = parseInt(localStorage.secInPassedDays, 10);
        this.secInPassedDays += this.SEC_IN_DAY;
        localStorage.setItem('secInPassedDays', this.secInPassedDays);
      }
      var tsec = now % 60;
      now = Math.floor(now / 60);
      if (tsec < 10) {
        tsec = '0' + tsec;
      }
      var tmin = now % 60;
      now = Math.floor(now / 60);
      if (tmin < 10) {
        tmin = '0' + tmin;
      }
      var thour = now % (24 * this.deadLinePeriod);
      now = Math.floor(now / 24);
      if (thour < 10) {
        thour = '0' + thour;
      }
      this.countdownContainer.innerHTML = thour + ':' + tmin + ':' + tsec;
      setTimeout(function () {
        this.countdownWork();
      }.bind(this), 1000);
    }
    return true;
  },

  // subtract
  limitSubtract: function limitSubtract() {
    var setExpenseValueField = document.querySelector('#setexpense-value-field');
    var setExpenseNameField = document.querySelector('#setexpense-name-field');
    this.expense = parseInt(setExpenseValueField.value, 10);
    if (Number.isInteger(this.expense) && this.expense > 0 && this.expense < 100000 && setExpenseNameField.value) {
      this.currentLimit = localStorage.currentLimit || this.initialLimit;
      this.currentLimit -= this.expense;
      localStorage.setItem('currentLimit', this.currentLimit);
      this.limitInputField.value = this.currentLimit;
      var expenseObj = {
        name: setExpenseNameField.value,
        price: this.expense
      };
      this.addExpenseItem(expenseObj);
      this.checkColorIndicator();
      if (this.currentLimit < -100000) {
        this.countdownIsOn = false;
        this.cycleEnded = true;
        return 'Limit is exceeded';
      }
      return this.currentLimit;
    } else {
      this.showSystemMessage(this.systemMessages.expenseErrorTxt, this.systemMessages.messageType['error'], 10000);
      return false;
    }
  },

  // adding expense items in a list
  addExpenseItem: function addExpenseItem(item) {
    if (localStorage.expenseItems) {
      this.expenseItems = JSON.parse(localStorage.expenseItems);
    }
    var expenseItem = {
      name: item.name,
      price: item.price
    };
    if (this.expenseItems.length >= 3) {
      this.expenseItems.pop();
    }
    this.expenseItems.unshift(expenseItem);
    localStorage.setItem('expenseItems', JSON.stringify(this.expenseItems));
    this.showExpenseList();
  },

  // showing expense list
  showExpenseList: function showExpenseList() {
    this.cleanAdviser();
    var isEmpty = true;
    if (localStorage.expenseItems) {
      this.expenseItems = JSON.parse(localStorage.expenseItems);
      isEmpty = false;
    }
    if (!isEmpty) {
      var expenseList = document.createElement('ul');
      expenseList.classList.add('expense-list');
      this.adviserContainer.appendChild(expenseList);
      expenseList.innerHTML = this.expenseItems.map(function (i) {
        return '<li class="expense-list__item">' + i.name + '<span class="expense-list__cash">' + i.price + '</span>' + '</li>';
      }).join('');
      var listItems = document.querySelectorAll('.expense-list__item');
      var defaultPadding = 12;
      for (var i = 0; i < listItems.length; i++) {
        listItems[i].style.paddingRight = listItems[i].children[0].offsetWidth + defaultPadding * 2 + 'px';
      }
    }
  },

  // simpl initialize
  init: function init() {
    this.addListeners();
    this.controlsState();
    if (localStorage.length) {
      // рабочее состояние - в локал сторож есть данные
      this.startDeadLine = new Date(Date.parse(localStorage.startDeadLine));
      this.endDeadLine = new Date(Date.parse(localStorage.endDeadLine));
      this.deadLinePeriod = localStorage.deadLinePeriod;
      this.secInPassedDays = localStorage.secInPassedDays;
      this.countdownIsOn = true;
      this.controlsState();
      this.checkColorIndicator();
      this.countdownWork();
      this.showExpenseList();
      this.limitInputField.value = this.currentLimit;
      clearTimeout(showTimer);
      var showTimer = setTimeout(function () {
        this.countdownContainer.style.display = 'block';
      }.bind(this), 1000);
    }
    if (localStorage.currentLimit && localStorage.currentLimit < -100000) {
      this.countdownIsOn = false;
      this.cycleEnded = true;
      this.endCycle();
    }
  },

  // renewing limit
  renewLimit: function renewLimit(sum) {
    this.currentLimit = parseInt(localStorage.currentLimit, 10) || parseInt(localStorage.initialLimit, 10);
    this.currentLimit += sum;
    this.limitInputField.value = this.currentLimit;
    localStorage.setItem('currentLimit', this.currentLimit);
    this.checkColorIndicator();
  },

  // end of cycle
  endCycle: function endCycle() {
    this.clearPopUpFields();
    var endDiv = document.createElement('div');
    endDiv.classList.add('pop-up');
    endDiv.innerHTML = '<div class="pop-up__wrapper">' + '<div id="end-verdict"></div>' + '<div id="end-stat"></div>' + '<div class="pop-up__controls">' + '<button type="button" class="btn" id="final-reset" data-pop-id="end-pop-up">Ok</button>' + '</div>' + '</div>';
    this.workingSpace.appendChild(endDiv);
    this.workingSpace.classList.add('pop-up-visible');
    this.loadStat();
  },

  // reset all
  resetAll: function resetAll() {
    this.countdownIsOn = false;
    this.cycleEnded = false;
    this.controlsState();
    this.cleanAdviser();
    this.initialLimit = '';
    this.currentLimit = '';
    this.startDeadLine = '';
    this.endDeadLine = '';
    this.deadLinePeriod = '';
    this.expenseItems = [];
    this.limitInputField.value = '';
    localStorage.clear();
    var popUps = document.querySelectorAll('.pop-up');
    for (var i = 0; i < popUps.length; i++) {
      popUps[i].style.display = '';
    }
    this.secInPassedDays = 86400;
    this.checkColorIndicator();
  },

  // loading stats
  loadStat: function loadStat() {
    var endVerdict = document.querySelector('#end-verdict');
    var endStat = document.querySelector('#end-stat');
    this.initialLimit = parseInt(localStorage.initialLimit, 10);
    this.currentLimit = parseInt(localStorage.currentLimit, 10);
    this.deadLinePeriod = parseInt(localStorage.deadLinePeriod, 10);
    this.limitInputField.value = this.currentLimit;
    if (!this.currentLimit || this.currentLimit > -100000) {
      endVerdict.innerHTML = '<p>Time is up</p>';
    } else {
      endVerdict.innerHTML = '<p>Purchase limit exceeded</p>';
    }
    if (!this.currentLimit || this.currentLimit === this.initialLimit * this.deadLinePeriod) {
      endStat.innerHTML = '<p>Day limit: ' + this.initialLimit + '</p>' + '<p>Period (days): ' + this.deadLinePeriod + '</p>' + '<p>Spent: 0</p>' + '<p>Saved: ' + this.initialLimit + '</p>' + '<p>Probably you did it wrong or didn\'t write down your purchases. Try again.</p>';
    } else if (this.currentLimit < 0) {
      endStat.innerHTML = '<p>Day limit: ' + this.initialLimit + '</p>' + '<p>Period (days): ' + this.deadLinePeriod + '</p>' + '<p>Spent: ' + (this.initialLimit * this.deadLinePeriod + Math.abs(this.currentLimit)) + '</p>' + '<p>Overspent: ' + Math.abs(this.currentLimit) + '</p>' + '<p>Try again.</p>';
    } else {
      endStat.innerHTML = '<p>Day limit: ' + this.initialLimit + '</p>' + '<p>Period (days): ' + this.deadLinePeriod + '</p>' + '<p>Spent: ' + (this.initialLimit * this.deadLinePeriod - this.currentLimit) + '</p>' + '<p>Saved: ' + this.currentLimit + '</p>' + '<p>Try again.</p>';
    }
  },

  // show indicator if negative balance
  checkColorIndicator: function checkColorIndicator() {
    if (parseInt(localStorage.currentLimit, 10) < 0) {
      this.limitInputField.classList.add('negative-balance');
    } else {
      this.limitInputField.classList.remove('negative-balance');
    }
  },

  // state of buttons - active / inactive
  controlsState: function controlsState() {
    var btns = document.querySelectorAll('.btn');
    if (this.countdownIsOn) {
      // app in progress
      document.body.classList.add('in-process');
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].classList.contains('init-load-btn')) {
          btns[i].disabled = true;
        } else {
          btns[i].disabled = false;
        }
      }
    } else {
      // app is stopped
      document.body.classList.remove('in-process');
      for (i = 0; i < btns.length; i++) {
        if (btns[i].classList.contains('in-process-btn')) {
          btns[i].disabled = true;
        } else {
          btns[i].disabled = false;
        }
      }
    }
  },

  // pop-up toggling
  togglePopUp: function togglePopUp(popUpType, fn) {
    this.clearPopUpFields();
    if (this.workingSpace.classList.contains('pop-up-visible')) {
      this.workingSpace.classList.remove('pop-up-visible');
      var contents = this.workingSpace.children;
      if (contents.length) {
        for (var i = 0; i < contents.length; i++) {
          if (contents[i].classList.contains('pop-up')) {
            this.workingSpace.removeChild(contents[i]);
          }
        }
      }
    } else {
      this.fillPopUp(popUpType, fn);
      this.workingSpace.classList.add('pop-up-visible');
    }
    if (this.cycleEnded) {
      this.endCycle();
    }
  },

  // pop-up filling with content
  fillPopUp: function fillPopUp(popUpType, fn) {
    var popUpDiv = document.createElement('div');
    popUpDiv.classList.add('pop-up');
    popUpDiv.id = popUpType;
    if (popUpType === 'setlimit-pop-up') {
      popUpDiv.innerHTML = '<div class="pop-up__wrapper">' + '<p class="pop-up__p">Set your day limit<br> 1 - 99999</p>' + '<div class="pop-up__field-wrapper">' + '<input type="number" class="pop-up__field" id="setlimit-field" min="1" max="99999" step="1" autofocus>' + '</div>' + '<p class="pop-up__p">Set a period<br> 1 - 7 (days)</p>' + '<div class="pop-up__field-wrapper custom-range">' + '<input type="range" id="deadline-range" min="1" max="7" step="1" value="1">' + '</div>' + '<div class="pop-up__field-wrapper">' + '<input type="text" class="pop-up__field" id="deadline-range-output" value="1">' + '</div>' + '<div class="pop-up__controls">' + '<button type="button" class="btn" id="setlimit-submit" data-pop-id="setlimit-pop-up">Ok</button>' + '<button type="button" class="btn" id="setlimit-cancel" data-pop-id="setlimit-pop-up">Cancel</button>' + '</div>' + '</div>';
    }
    if (popUpType === 'rest-confirm-pop-up') {
      popUpDiv.innerHTML = '<div class="pop-up__wrapper">' + '<p class="pop-up__p">Your progress will be lost. Continue?</p><br>' + '<div class="pop-up__controls">' + '<button type="button" class="btn" id="reset-confirm" data-pop-id="rest-confirm-pop-up">Ok</button>' + '<button type="button" class="btn" id="reset-cancel" data-pop-id="rest-confirm-pop-up">Cancel</button>' + '</div>' + '</div>';
    }
    if (popUpType === 'setexpense-pop-up') {
      popUpDiv.innerHTML = '<div class="pop-up__wrapper">' + '<p class="pop-up__p">Amount spent</p>' + '<div class="pop-up__field-wrapper">' + '<input type="number" class="pop-up__field" id="setexpense-value-field" min="1" max="99999" step="1" value="" autofocus>' + '</div>' + '<p class="pop-up__p">Purchase description</p>' + '<div class="pop-up__field-wrapper">' + '<input type="text" class="pop-up__field" maxlength="30" id="setexpense-name-field" value="">' + '</div>' + '<div class="pop-up__controls">' + '<button type="button" class="btn" id="setexpense-submit">Ok</button>' + '<button type="button" class="btn" id="setexpense-cancel" data-pop-id="setexpense-pop-up">Cancel</button>' + '</div>' + '</div>';
    }
    this.workingSpace.appendChild(popUpDiv);
    if (fn) {
      fn();
    }
  },

  // clearing pop-up fields
  clearPopUpFields: function clearPopUpFields() {
    var popUpFields = document.querySelectorAll('.pop-up__field');
    for (var i = 0; i < popUpFields.length; i++) {
      popUpFields[i].value = '';
    }
  },

  // clearing adviser field
  cleanAdviser: function cleanAdviser() {
    clearInterval(this.animateAdvise);
    clearTimeout(this.messageHide);
    this.adviserContainer.innerHTML = '';
    this.adviserContainer.className = '';
    this.adviserContainer.classList.add('adviser__wrapper');
  },

  // actions for control elements
  btnAction: function btnAction(evt) {
    var self = simpl;
    var id = evt.target.id;
    var isBtn = evt.target.classList.contains('btn');
    var popUpType = evt.target.dataset.popId;
    if (!isBtn) {
      return;
    }
    if (id === 'final-reset' || id === 'reset-confirm') {
      self.resetAll();
      self.togglePopUp(popUpType);
    } else if (id === 'setlimit-submit') {
      self.setLimit();
      self.togglePopUp(popUpType);
    } else if (id === 'setexpense-submit') {
      self.limitSubtract();
      if (!this.cycleEnded) {
        self.togglePopUp(popUpType);
      }
    } else if (id === 'set-limit-btn') {
      self.togglePopUp(popUpType, function () {
        var rangeSlider = document.querySelector('#deadline-range');
        var rangeOutput = document.querySelector('#deadline-range-output');
        rangeSlider.addEventListener('input', function () {
          rangeOutput.value = rangeSlider.value;
        });
      });
    } else {
      self.togglePopUp(popUpType);
    }
  },

  // showing system messages
  showSystemMessage: function showSystemMessage(systemMessageText, messageType, expandTime) {
    var i = 0;
    var blinkingCursor = '<span class="blinking-cursor">&nbsp;</span>';
    var speed = 30;
    this.cleanAdviser();
    this.animateAdvise = setInterval(function () {
      this.adviserContainer.innerHTML += systemMessageText[i];
      i++;
      if (i === systemMessageText.length) {
        clearInterval(this.animateAdvise);
        this.adviserContainer.innerHTML += blinkingCursor;
        this.adviserContainer.classList.add(messageType);
      }
    }.bind(this), speed); // магическое число
    this.messageHide = setTimeout(function () {
      this.cleanAdviser();
      this.showExpenseList();
    }.bind(this), expandTime = expandTime || 5000);
  },

  // messages object
  systemMessages: {
    expenseErrorTxt: 'Invalid value. Valid purchase amount is from 1 to 99999, purchase description field can\'t be empty ',
    limitErrorTxt: 'Invalid value. Valid limit: 1 to 99999. Valid period: 1 - 7 days ',
    messageType: {
      error: 'error-message-open',
      regular: 'regular-message-open'
    }
  }
};

simpl.init();