'use strict';

var simpl = {
  SEC_IN_DAY: 86400,
  secInPassedDays: 86400,
  countdownIsOn: this.countdownIsOn || false,
  expense: 0,
  initialLimit: localStorage.initialLimit || this.initialLimit || '',
  currentLimit: localStorage.currentLimit || this.currentLimit || '',
  startDeadLine: localStorage.startDeadLine || this.startDeadLine || '',
  deadLinePeriod: localStorage.deadLinePeriod || this.deadLinePeriod || '',
  endDeadLine: localStorage.endDeadLine || this.endDeadLine || '',
  expenseItems: localStorage.expenseItems || this.expenseItems || [],

  // DOM элементы
  workingSpace: document.querySelector('#main'),
  adviserContainer: document.querySelector('#adviser-content-wrapper'),
  countdownContainer: document.querySelector('#countdown'),
  limitInputField: document.querySelector('#limit-field'),
  endPopUp: document.querySelector('#end-pop-up'),
  rangeOutput: document.querySelector('#deadline-range-output'),

  // для setTimeout и setInterval
  messageHide: this.messageHide || '',
  animateAdvise: this.animateAdvise || '',

  // добавление обработчиков
  addListeners: function() {
    var self = simpl;
    // self.deadlineRange.addEventListener('input', function() {
    //   self.rangeOutput.innerHTML = self.deadlineRange.value;
    // });
    self.workingSpace.addEventListener('click', self.btnAction);
  },

  // установка лимита
  setLimit: function() {
    var setlimitField = document.querySelector('#setlimit-field');
    var deadlineRange = document.querySelector('#deadline-range-field');
    this.cleanAdviser();
    this.initialLimit = parseInt(setlimitField.value, 10);
    this.deadLinePeriod = parseInt(deadlineRange.value, 10);
    if(this.deadLinePeriod < 1 || this.deadLinePeriod > 7 || this.initialLimit < 0 || isNaN(this.initialLimit) || this.initialLimit > 29999) {
      this.showSystemMessage(this.systemMessages.limitErrorTxt, this.systemMessages.messageType['error'], 10000);
      return 'Invalid value';
    }
    this.limitInputField.value = this.initialLimit;
    localStorage.setItem('initialLimit', this.initialLimit);
    localStorage.setItem('secInPassedDays', this.secInPassedDays);
    this.setInitialTimer();
    setTimeout(function() {
      this.countdownWork();
      this.countdownContainer.style.display = 'block';
    }.bind(this), 1000);
    this.controlsState();
    this.currentLimit = this.initialLimit;
    localStorage.setItem('currentLimit', this.currentLimit);
    return this.initialLimit;
  },

  // установка таймера
  setInitialTimer: function() {
    this.startDeadLine = new Date();
    this.endDeadLine = new Date();
    this.endDeadLine.setDate(this.startDeadLine.getDate() + this.deadLinePeriod);
    localStorage.setItem('startDeadLine', this.startDeadLine);
    localStorage.setItem('endDeadLine', this.endDeadLine);
    localStorage.setItem('deadLinePeriod', this.deadLinePeriod);
    this.countdownIsOn = true;
  },

  // запуск и работа таймера
  countdownWork: function() {
    if(!this.countdownIsOn) {
      this.countdownContainer.innerHTML = '';
    } else {
      var now = new Date();
      now = Math.floor((this.endDeadLine - now) / 1000);
      if(now <= 0) {
        // до тех пор пока текущее прошедшее время меньше установленного срока
        // и сумма текущего и первоначального лимита не превышает максимально возможной на балансе суммы
        // обновляем баланс на сумму первоначального лимита
        while( parseInt(localStorage.secInPassedDays, 10) < (this.deadLinePeriod * this.SEC_IN_DAY) &&
          parseInt(localStorage.currentLimit, 10) + parseInt(localStorage.initialLimit, 10) < parseInt(localStorage.initialLimit, 10) * this.deadLinePeriod ) {
          this.renewLimit(parseInt(localStorage.initialLimit, 10));
          localStorage.setItem('secInPassedDays', this.secInPassedDays);
        }
        this.countdownIsOn = false;
        this.togglePopUp(this.endPopUp);
        this.endPopUpFill();
        return false;
      }
      if( ((this.deadLinePeriod * this.SEC_IN_DAY) - now) > parseInt(localStorage.secInPassedDays, 10) && now > 0 ) {
        this.renewLimit(parseInt(localStorage.initialLimit, 10));
        this.secInPassedDays = parseInt(localStorage.secInPassedDays, 10);
        this.secInPassedDays += this.SEC_IN_DAY;
        localStorage.setItem('secInPassedDays', this.secInPassedDays);
      }
      var tsec = now % 60;
      now = Math.floor(now / 60);
      if(tsec < 10) {
        tsec = '0' + tsec;
      }
      var tmin = now % 60;
      now = Math.floor(now / 60);
      if(tmin < 10) {
        tmin = '0' + tmin;
      }
      var thour = now % (24 * this.deadLinePeriod);
      now = Math.floor(now / 24);
      if(thour < 10) {
        thour = '0' + thour;
      }
      this.countdownContainer.innerHTML = thour + ':' + tmin + ':' + tsec;
      setTimeout(function() {
        this.countdownWork();
      }.bind(this), 1000);
    }
    return true;
  },

   // значения для списания
  setExpensePopUpFill: function() {
    var setExpensePopUp = document.querySelector('#setexpense-pop-up');
    var setExpenseValueField = document.querySelector('#setexpense-value-field');
    this.expense = parseInt(setExpenseValueField.value, 10);
    this.limitSubtract();
    this.togglePopUp(setExpensePopUp);
  },

  // cписание средств
  limitSubtract: function() {
    var setExpenseNameField = document.querySelector('#setexpense-name-field');
    if(Number.isInteger(this.expense) && this.expense > 0 && this.expense < 30000 && setExpenseNameField.value) {
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

      if(this.currentLimit < -30000) {
        this.countdownIsOn = false;
        this.togglePopUp(this.endPopUp);
        this.endPopUpFill();
        return 'Limit is exceeded';
      }

      return this.currentLimit;
    } else {
      this.showSystemMessage(this.systemMessages.expenseErrorTxt, this.systemMessages.messageType['error'], 10000);
      return false;
    }
  },

  // добавление в список покупок
  addExpenseItem: function(item) {
    if(localStorage.expenseItems) {
      this.expenseItems = JSON.parse(localStorage.expenseItems);
    }
    var expenseItem = {
      name: item.name,
      price: item.price
    };
    if(this.expenseItems.length >= 3) {
      this.expenseItems.pop();
    }
    this.expenseItems.unshift(expenseItem);
    localStorage.setItem('expenseItems', JSON.stringify(this.expenseItems));
    this.showExpenseList();
  },

  // отображение списка покупок
  showExpenseList: function() {
    this.cleanAdviser();
    var isEmpty = true;
    if(localStorage.expenseItems) {
      this.expenseItems = JSON.parse(localStorage.expenseItems);
      isEmpty = false;
    }
    if(!isEmpty) {
      var expenseList = document.createElement('ul');
      expenseList.classList.add('expense-list');
      this.adviserContainer.appendChild(expenseList);
      expenseList.innerHTML = this.expenseItems.map(function(i) {
        return '<li class="expense-list__item">' + i.name + '<span class="expense-list__cash">' + i.price + '</span>' + '</li>';
      }).join('');
      var listItems = document.querySelectorAll('.expense-list__item');
      var defaultPadding = 12;
      for(var i = 0; i < listItems.length; i++) {
        listItems[i].style.paddingRight = listItems[i].children[0].offsetWidth + defaultPadding * 2 + 'px';
      }
    }
  },

  // запуск приложения
  init: function() {
    this.addListeners();
    this.controlsState();
    if(localStorage.currentLimit && localStorage.currentLimit < -30000) {
      this.countdownIsOn = false;
      this.togglePopUp(this.endPopUp);
      this.endPopUpFill();
    }
    if(localStorage.length) { // рабочее состояние - в локал сторож есть данные
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
      var showTimer = setTimeout(function() {
        this.countdownContainer.style.display = 'block';
      }.bind(this), 1000);
    }
  },

  // обновление текущего лимита раз в сутки
  renewLimit: function(sum) {
    this.currentLimit = parseInt(localStorage.currentLimit, 10) || parseInt(localStorage.initialLimit, 10);
    this.currentLimit += sum;
    this.limitInputField.value = this.currentLimit;
    localStorage.setItem('currentLimit', this.currentLimit);
    this.checkColorIndicator();
  },

  // сброс всего (рестарт)
  restart: function() {
    this.countdownIsOn = false;
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
    for(var i = 0; i < popUps.length; i++) {
      popUps[i].style.display = '';
    }
    this.secInPassedDays = 86400;
    this.checkColorIndicator();
  },

  // вывод и наполнение финального поп-апа
  endPopUpFill: function() {
    var endVerdict = document.querySelector('#end-verdict');
    var endStat = document.querySelector('#end-stat');
    this.initialLimit = parseInt(localStorage.initialLimit, 10);
    this.currentLimit = parseInt(localStorage.currentLimit, 10);
    this.deadLinePeriod = parseInt(localStorage.deadLinePeriod, 10);
    this.limitInputField.value = this.currentLimit;
    if(!this.currentLimit || this.currentLimit > -30000) {
      endVerdict.innerHTML = '<p>Time is up</p><br>';
    } else {
      endVerdict.innerHTML = '<p>Purchase limit exceeded</p><br>';
    }
    if(!this.currentLimit || this.currentLimit === this.initialLimit * this.deadLinePeriod) {
      endStat.innerHTML =
      '<p>Day limit: ' + this.initialLimit + '</p>' +
      '<p>Period (days): ' + this.deadLinePeriod + '</p>' +
      '<p>Spent: 0</p>' +
      '<p>Saved: ' + this.initialLimit + '</p>' +
      '<p>Probably you did it wrong or didn\'t write down your purchases. Try again.</p>';
    } else if(this.currentLimit < 0) {
      endStat.innerHTML =
      '<p>Day limit: ' + this.initialLimit + '</p>' +
      '<p>Period (days): ' + this.deadLinePeriod + '</p>' +
      '<p>Spent: ' + ((this.initialLimit * this.deadLinePeriod) + Math.abs(this.currentLimit)) + '</p>' +
      '<p>Overspent: ' + Math.abs(this.currentLimit) + '</p>' +
      '<p>Try again.</p>';
    } else {
      endStat.innerHTML =
      '<p>Day limit: ' + this.initialLimit + '</p>' +
      '<p>Period (days): ' + this.deadLinePeriod + '</p>' +
      '<p>Spent: ' + ((this.initialLimit * this.deadLinePeriod) - this.currentLimit) + '</p>' +
      '<p>Saved: ' + this.currentLimit + '</p>' +
      '<p>Try again.</p>';
    }
  },

  // индикатор отрицательного баланса
  checkColorIndicator: function() {
    if(parseInt(localStorage.currentLimit, 10) < 0) {
      this.limitInputField.classList.add('negative-balance');
    } else {
      this.limitInputField.classList.remove('negative-balance');
    }
  },

  // состояние кнопок
  controlsState: function() {
    var btns = document.querySelectorAll('.btn');
    if(this.countdownIsOn) {
      // приложение запущено
      document.body.classList.add('in-process');
      for(var i = 0; i < btns.length; i++) {
        if(btns[i].classList.contains('init-load-btn')) {
          btns[i].disabled = true;
        } else {
          btns[i].disabled = false;
        }
      }
    } else {
      // первоначальное состояние
      document.body.classList.remove('in-process');
      for(i = 0; i < btns.length; i++) {
        if(btns[i].classList.contains('in-process-btn')) {
          btns[i].disabled = true;
        } else {
          btns[i].disabled = false;
        }
      }
    }
  },

  // отображение поп-апов
  togglePopUp: function(popUpType) {
    if(this.workingSpace.classList.contains('pop-up-visible')) {
      this.workingSpace.classList.remove('pop-up-visible');
      this.removePopUp(popUpType);
    } else {
      this.fillPopUp(popUpType);
      this.workingSpace.classList.add('pop-up-visible');
    }
    this.clearPopUpFields();
  },

  fillPopUp: function(popUpType) {
    var popUpDiv = document.createElement('div');
    popUpDiv.classList.add('pop-up');
    popUpDiv.id = popUpType;
    if(popUpType === 'setlimit-pop-up') {
      popUpDiv.innerHTML =
      '<div class="pop-up__wrapper">' +
        '<p class="pop-up__p">Set your day limit<br> 1 - 29999</p>' +
        '<div class="pop-up__field-wrapper">' +
          '<input type="number" class="pop-up__field" id="setlimit-field" min="1" max="29999" step="1" autofocus>' +
        '</div>' +
        '<p class="pop-up__p">Set a period<br> 1 - 7 (days)</p>' +
        '<div class="pop-up__field-wrapper custom-range">' +
          '<input type="range" id="deadline-range-field" min="1" max="7" step="1" value="1">' +
        '</div>' +
        '<div class="pop-up__field-wrapper">' +
          '<span id="deadline-range-output">1</span>' +
        '</div>' +
        '<div class="pop-up__controls">' +
          '<button type="button" class="btn" id="setlimit-submit" data-pop-id="setlimit-pop-up">Ok</button>' +
          '<button type="button" class="btn" id="setlimit-cancel" data-pop-id="setlimit-pop-up">Cancel</button>' +
        '</div>' +
      '</div>';
    }
    if(popUpType === 'rest-confirm-pop-up') {
      popUpDiv.innerHTML =
      '<div class="pop-up__wrapper">' +
        '<p class="pop-up__p">Your progress will be lost. Continue?</p><br>' +
        '<div class="pop-up__controls">' +
          '<button type="button" class="btn" id="restart-confirm" data-pop-id="rest-confirm-pop-up">Ok</button>' +
          '<button type="button" class="btn" id="restart-cancel" data-pop-id="rest-confirm-pop-up">Cancel</button>' +
        '</div>' +
      '</div>';
    }

    this.workingSpace.appendChild(popUpDiv);
  },

  removePopUp: function(popUpType) {
    var pop = document.getElementById(popUpType);
    this.workingSpace.removeChild(pop);
  },

  // очистка полей поп-апов
  clearPopUpFields: function() {
    var popUpFields = document.querySelectorAll('.pop-up__field');
    for(var i = 0; i < popUpFields.length; i++) {
      popUpFields[i].value = '';
    }
    //this.deadlineRange.value = 1;
    //this.rangeOutput.innerHTML = 1;
  },

  // очистка поля с сообщением
  cleanAdviser: function() {
    clearInterval(this.animateAdvise);
    clearTimeout(this.messageHide);
    this.adviserContainer.innerHTML = '';
    this.adviserContainer.className = '';
    this.adviserContainer.classList.add('adviser__wrapper');
  },

  // действия для управляющих элементов
  btnAction: function(evt) {
    var self = simpl;
    var id = evt.target.id;
    var popUpType = evt.target.dataset.popId;
    if(id === 'end-restart' || id === 'restart-confirm') {
      self.togglePopUp(popUpType);
      self.restart();
    } else if(id === 'setlimit-submit') {
      self.setLimit();
      self.togglePopUp(popUpType);
    } else if(id === 'setlimit-cancel') {
      self.togglePopUp(popUpType);
    } else if(id === 'restart-confirm') {
      self.restart();
      self.togglePopUp(popUpType);
    } else if(id === 'set-limit-btn') {
      self.togglePopUp(popUpType);
    } else if(id === 'reset-btn') {
      self.togglePopUp(popUpType);
    }
  },

  // вывод системных сообщений
  showSystemMessage: function(systemMessageText, messageType, expandTime) {
    var i = 0;
    var blinkingCursor = '<span class="blinking-cursor">&nbsp;</span>';
    var speed = 30;
    this.cleanAdviser();
    this.animateAdvise = setInterval(function() {
      this.adviserContainer.innerHTML += systemMessageText[i];
      i++;
      if(i === systemMessageText.length) {
        clearInterval(this.animateAdvise);
        this.adviserContainer.innerHTML += blinkingCursor;
        this.adviserContainer.classList.add(messageType);
      }
    }.bind(this), speed); // магическое число
    this.messageHide = setTimeout(function() {
      this.cleanAdviser();
      this.showExpenseList();
    }.bind(this), expandTime = expandTime || 5000);
  },

  // объект с сообщениями
  systemMessages: {
    expenseErrorTxt: 'Invalid value. Valid purchase amount is from 1 to 29999, purchase description field can\'t be empty ',
    limitErrorTxt: 'Invalid value. Valid limit: 1 to 29999. Valid period: 1 - 7 days ',
    messageType: {
      error: 'error-message-open',
      regular: 'regular-message-open'
    }
  }
};

simpl.init();

// Цели

// 1. Оптимизация - стили, жс в частности simpl.init - чет каша какая-то :)
// 2. ДИЗАЙН!
//  2.1 Лого??
// 3. Шрифты
// 4. Подумать над поп-апами. Возможно правильнее сделать один и наполнять его разным контентом.
// 5. Сабмит по ентеру
// 6. Ограничить длину строки "описание покупки"

// Баги

// 1. На телефоне при фокусе в поле суммы, футер поднимается вверх (установил минимальную высоту для боди) ✔
// 2. Сбрасывать состояние range при выходе из поп-апа установки лимита ✔
// 3. Ошибки с forEach в FF (btns.forEach; popUpFields) (заменил на обычные циклы) ✔
// 4. .main флексит весь контент по центру. Без покупок смотрится не очень, ибо покупки при добавлении толкают кнопки наверх (минимальная высота для блока с подсказками) ✔
