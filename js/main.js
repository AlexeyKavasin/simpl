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
  setlimitField: document.querySelector('#setlimit-field'),
  deadlineRange: document.querySelector('#deadline-range-field'),
  endPopUp: document.querySelector('#end-pop-up'),

  // для setTimeout и setInterval
  messageHide: this.messageHide || '',
  animateAdvise: this.animateAdvise || '',

  // значения для установки лимита
  setLimitPopUpFill: function() {
    var setLimitPopUp = document.querySelector('#setlimit-pop-up');
    this.initialLimit = parseInt(this.setlimitField.value, 10);
    this.deadLinePeriod = parseInt(this.deadlineRange.value, 10);
    this.togglePopUpView(setLimitPopUp);
    this.setLimit();
  },

  // добавление обработчиков
  addListeners: function() {
    var self = simpl;
    self.deadlineRange.addEventListener('input', function() {
      var rangeOutput = document.querySelector('#deadline-range-output');
      rangeOutput.innerHTML = self.deadlineRange.value;
    });
    self.workingSpace.addEventListener('click', self.btnAction);
  },

  // установка лимита
  setLimit: function() {
    this.cleanAdviser();
    if(this.deadLinePeriod < 1 || this.deadLinePeriod > 9 || this.initialLimit < 0 || isNaN(this.initialLimit) || this.initialLimit >= 30000) {
      this.showSystemMessage(this.systemMessages.limitErrorTxt, this.systemMessages.messageType['error'], 10000);
      return 'Значение некорректно';
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
        this.togglePopUpView(this.endPopUp);
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
    this.togglePopUpView(setExpensePopUp);
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
        this.togglePopUpView(this.endPopUp);
        this.endPopUpFill();
        return 'Вы превысили лимит';
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
    }
  },

  // запуск приложения
  init: function() {
    this.addListeners();
    this.controlsState();
    if(localStorage.currentLimit && localStorage.currentLimit < -30000) {
      this.countdownIsOn = false;
      this.togglePopUpView(this.endPopUp);
      this.endPopUpFill();
    }
    if(localStorage.length) { // ХЗ
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
    this.setlimitField.value = '';
    localStorage.clear();
    document.querySelectorAll('.pop-up').forEach(function(p) {
      p.style.display = '';
    });
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
      endVerdict.innerHTML = '<p>Время истекло</p><br>';
    } else {
      endVerdict.innerHTML = '<p>Превышен лимит трат</p><br>';
    }
    if(!this.currentLimit || this.currentLimit === this.initialLimit * this.deadLinePeriod) {
      endStat.innerHTML =
      '<p>Дневной лимит: ' + this.initialLimit + '</p>' +
      '<p>Период (в днях): ' + this.deadLinePeriod + '</p>' +
      '<p>Потрачено за период: 0</p>' +
      '<p>Сэкономлено: ' + this.initialLimit + '</p>' +
      '<p>Возможно, вы не записывали свои расходы. Попробуйте еще раз.</p>';
    } else if(this.currentLimit < 0) {
      endStat.innerHTML =
      '<p>Дневной лимит: ' + this.initialLimit + '</p>' +
      '<p>Период (в днях): ' + this.deadLinePeriod + '</p>' +
      '<p>Потрачено за период: ' + ((this.initialLimit * this.deadLinePeriod) + Math.abs(this.currentLimit)) + '</p>' +
      '<p>Перерасход составил: ' + Math.abs(this.currentLimit) + '</p>' +
      '<p>Попробуйте еще раз.</p>';
    } else {
      endStat.innerHTML =
      '<p>Дневной лимит: ' + this.initialLimit + '</p>' +
      '<p>Период (в днях): ' + this.deadLinePeriod + '</p>' +
      '<p>Потрачено за период: ' + ((this.initialLimit * this.deadLinePeriod) - this.currentLimit) + '</p>' +
      '<p>Сэкономлено: ' + this.currentLimit + '</p>' +
      '<p>Попробуйте еще раз.</p>';
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
      btns.forEach(function(btn) {
        if(btn.classList.contains('init-load-btn')) {
          btn.disabled = true;
        } else {
          btn.disabled = false;
        }
      });
    } else {
      // приложение не запущено
      document.body.classList.remove('in-process');
      btns.forEach(function(btn) {
        if(btn.classList.contains('in-process-btn')) {
          btn.disabled = true;
        } else {
          btn.disabled = false;
        }
      });
    }
  },

  // отображение поп-апов
  togglePopUpView: function(pop) {
    if(pop.style.display === 'flex') {
      pop.style.display = '';
    } else {
      pop.style.display = 'flex';
    }
    this.clearPopUpFields();
  },

  // очистка полей поп-апов
  clearPopUpFields: function() {
    var popUpFields = document.querySelectorAll('.pop-up__field');
    popUpFields.forEach(function(field) {
      field.value = '';
    });
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
    var popId = evt.target.dataset.popId;
    var popup = document.getElementById(popId);
    if(id === 'set-limit-btn' || id === 'reset-btn' || id === 'limit-subtract-btn' || id === 'restart-cancel' || id === 'setlimit-cancel' || id === 'setexpense-cancel') {
      self.togglePopUpView(popup);
    } else if(id === 'end-restart' || id === 'restart-confirm') {
      self.togglePopUpView(popup);
      self.restart();
    } else if(id === 'setlimit-submit') {
      self.setLimitPopUpFill();
    } else if(id === 'setexpense-submit') {
      self.setExpensePopUpFill();
    }
  },

  // вывод системных сообщений
  showSystemMessage: function(systemMessageText, messageType, expandTime) {
    var i = 0;
    var blinkingCursor = '<span class="blinking-cursor">&nbsp;</span>';
    this.cleanAdviser();
    this.animateAdvise = setInterval(function() {
      this.adviserContainer.innerHTML += systemMessageText[i];
      i++;
      if(i === systemMessageText.length) {
        clearInterval(this.animateAdvise);
        this.adviserContainer.innerHTML += blinkingCursor;
        this.adviserContainer.classList.add(messageType);
      }
    }.bind(this), 30); // магическое число
    this.messageHide = setTimeout(function() {
      this.cleanAdviser();
      this.showExpenseList();
    }.bind(this), expandTime = expandTime || 5000);
  },

  // объект с сообщениями
  systemMessages: {
    expenseErrorTxt: 'Значение некорректно. Допустимая сумма покупки - от 1 до 29999, поле наименование покупки не может быть пустым ',
    limitErrorTxt: 'Значение некорректно. Допустимый лимит - от 1 до 29999. Допустимый период - от 1 до 9 дней ',
    messageType: {
      error: 'error-message-open',
      regular: 'regular-message-open'
    }
  }
};

simpl.init();

// Цели

// 1. Оптимизация - стили, жс в частности simpl.init - чет каша какая-то :)
// 2. Для пунктов списка expenseItems задавать паддинг справа на js. Паддинг равен span.offsetWidth + стандартный паддинг * 2
// 3. ДИЗАЙН!
// 4. Шрифты
// 5. Подумать над поп-апами. Возможно правильнее сделать один и наполнять его разным контентом.

// Баги

// 1. На телефоне при фокусе в поле суммы, футер поднимается вверх
//
