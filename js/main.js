'use strict';

var workingSpace = document.querySelector('#main');
var limitInputField = document.querySelector('#limit-field'); // Поле с суммой
var adviserContainer = document.querySelector('#adviser-content-wrapper'); // Поле для вывода сообщений
var countdownContainer = document.getElementById('countdown'); // Контейнер для таймера
// Поп-ап со статистикой (финальный)
var endPopUp = document.querySelector('#end-pop-up');
// Поп-ап установка лимита
var deadlineRange = document.querySelector('#deadline-range-field');
var setlimitField = document.querySelector('#setlimit-field');
// Поп-ап списание средств
var setExpenseNameField = document.querySelector('#setexpense-name-field');
var setExpenseValueField = document.querySelector('#setexpense-value-field');

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
  // setTimeout, setInterval
  messageHide: this.messageHide || '',
  animateAdvise: this.animateAdvise || '',
  // значения для установки лимита
  setLimitPopUpFill: function() {
    this.initialLimit = parseInt(setlimitField.value, 10);
    this.deadLinePeriod = parseInt(deadlineRange.value, 10);
    var setLimitPopUp = document.querySelector('#setlimit-pop-up');
    this.togglePopUpView(setLimitPopUp);
    this.setLimit();
  },
  // установка лимита
  setLimit: function() {
    var self = this;
    this.cleanAdviser();
    if(this.deadLinePeriod < 1 || this.deadLinePeriod > 9 || this.initialLimit < 0 || isNaN(this.initialLimit) || this.initialLimit > 30000) {
      this.showSystemMessage(this.systemMessages.limitErrorTxt, this.systemMessages.messageType['error'], 10000);
      return 'Значение некорректно';
    }
    limitInputField.value = this.initialLimit;
    localStorage.setItem('initialLimit', this.initialLimit);
    localStorage.setItem('secInPassedDays', this.secInPassedDays);
    this.setInitialTimer();
    setTimeout(function() {
      self.countdownWork();
      countdownContainer.style.display = 'block';
    }, 1000);
    this.controlsState();
    this.currentLimit = this.initialLimit;
    localStorage.setItem('currentLimit', this.currentLimit);
    return this.initialLimit;
  },
  // таймер
  // установка
  setInitialTimer: function() {
    this.startDeadLine = new Date();
    this.endDeadLine = new Date();
    this.endDeadLine.setDate(this.startDeadLine.getDate() + this.deadLinePeriod);
    localStorage.setItem('startDeadLine', this.startDeadLine);
    localStorage.setItem('endDeadLine', this.endDeadLine);
    localStorage.setItem('deadLinePeriod', this.deadLinePeriod);
    this.countdownIsOn = true;
  },
  // запуск и работа
  countdownWork: function() {
    var self = this;
    if(!this.countdownIsOn) {
      countdownContainer.innerHTML = '';
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
        this.togglePopUpView(endPopUp);
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

      countdownContainer.innerHTML = thour + ':' + tmin + ':' + tsec;

      setTimeout(function() {
        self.countdownWork();
      }, 1000);
    }
    return true;
  },
   // значения для списания
  setExpensePopUpFill: function() {
    var setExpensePopUp = document.querySelector('#setexpense-pop-up');
    this.expense = parseInt(setExpenseValueField.value, 10);
    this.togglePopUpView(setExpensePopUp);
    this.limitSubtract();
  },
  // cписание средств
  limitSubtract: function() {
    if(Number.isInteger(this.expense) && this.expense > 0 && this.expense < 30000 && setExpenseNameField.value) {
      this.currentLimit = localStorage.currentLimit || this.initialLimit;
      this.currentLimit -= this.expense;
      localStorage.setItem('currentLimit', this.currentLimit);
      limitInputField.value = this.currentLimit;
      this.addExpenseItem(setExpenseNameField.value);
      this.checkColorIndicator();

      if(this.currentLimit < -30000) {
        this.countdownIsOn = false;
        this.togglePopUpView(endPopUp);
        this.endPopUpFill();
        return 'Вы превысили лимит';
      }

      return this.currentLimit;
    } else {
      this.showSystemMessage(this.systemMessages.expenseErrorTxt, this.systemMessages.messageType['error'], 10000);
      return false;
    }
  },
  // добавление в список трат
  addExpenseItem: function(item) {
    if(localStorage.expenseItems) {
      this.expenseItems = localStorage.expenseItems.split(',');
    }
    if(this.expenseItems.length >= 3) {
      this.expenseItems.pop();
    }
    this.expenseItems.unshift(item);
    localStorage.setItem('expenseItems', this.expenseItems);
    this.showExpenseList();
  },
  showExpenseList: function() {
    this.cleanAdviser();
    if(localStorage.expenseItems) {
      this.expenseItems = localStorage.expenseItems.split(',');
    }
    var expenseList = document.createElement('ul');
    expenseList.classList.add('expense-list');
    adviserContainer.appendChild(expenseList);
    expenseList.innerHTML = this.expenseItems.map(function(i) {
      return '<li>' + i + '</li>';
    }).join('');
  },
  // запуск приложения при повторной загрузке
  init: function() {
    this.startDeadLine = new Date(Date.parse(localStorage.startDeadLine));
    this.endDeadLine = new Date(Date.parse(localStorage.endDeadLine));
    this.deadLinePeriod = localStorage.deadLinePeriod;
    this.secInPassedDays = localStorage.secInPassedDays;
    this.countdownIsOn = true;
    this.controlsState();
    this.checkColorIndicator();
    this.countdownWork();
    this.showExpenseList();
    clearTimeout(showTimer);
    var showTimer = setTimeout(function() {
      countdownContainer.style.display = 'block';
    }, 1000);
  },
  // обновление текущего лимита раз в сутки
  renewLimit: function(sum) {
    this.currentLimit = parseInt(localStorage.currentLimit, 10) || parseInt(localStorage.initialLimit, 10);
    this.currentLimit += sum;
    limitInputField.value = this.currentLimit;
    localStorage.setItem('currentLimit', this.currentLimit);
    this.checkColorIndicator();
  },
  // рестарт
  restart: function() {
    this.countdownIsOn = false;
    this.controlsState();
    this.cleanAdviser();
    localStorage.clear();
    this.initialLimit = '';
    this.currentLimit = '';
    this.startDeadLine = '';
    this.endDeadLine = '';
    this.deadLinePeriod = '';
    this.expenseItems = [];
    limitInputField.value = '';
    setlimitField.value = '';
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
    limitInputField.value = this.currentLimit;

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
      limitInputField.classList.add('negative-balance');
    } else {
      limitInputField.classList.remove('negative-balance');
    }
  },
  // состояние кнопок
  controlsState: function() {
    var initialBtns = document.querySelectorAll('.init-load-btn');
    var inProcessBtns = document.querySelectorAll('.in-process-btn');
    if(!this.countdownIsOn) {
      initialBtns.forEach(function(btn) {
        btn.disabled = false;
        btn.classList.remove('inactive');
      });
      inProcessBtns.forEach(function(btn) {
        btn.disabled = true;
        btn.classList.add('inactive');
      });
      limitInputField.style.fontSize = '0.9em';
    } else {
      inProcessBtns.forEach(function(btn) {
        btn.disabled = false;
        btn.classList.remove('inactive');
      });
      initialBtns.forEach(function(btn) {
        btn.disabled = true;
        btn.classList.add('inactive');
      });
      limitInputField.style.fontSize = '1.25em';
    }
  },
  // отображение поп-апов
  togglePopUpView: function(pop) {
    if(pop.style.display === 'flex') {
      pop.style.display = '';
    } else {
      pop.style.display = 'flex';
    }
  },
  // очистка поля с сообщением
  cleanAdviser: function() {
    clearInterval(this.animateAdvise);
    clearTimeout(this.messageHide);
    adviserContainer.innerHTML = '';
    adviserContainer.className = '';
  },
  // вывод системных сообщений (с анимацией)
  showSystemMessage: function(systemMessageText, messageType, expandTime) {
    var i = 0;
    var self = this;
    var blinkingCursor = '<span class="blinking-cursor">&nbsp;</span>';
    this.cleanAdviser();
    this.animateAdvise = setInterval(function() {
      adviserContainer.innerHTML += systemMessageText[i];
      i++;
      if(i === systemMessageText.length) {
        clearInterval(self.animateAdvise);
        adviserContainer.innerHTML += blinkingCursor;
        adviserContainer.classList.add(messageType);
      }
    }, 30); // магическое число
    this.messageHide = setTimeout(function() {
      self.cleanAdviser();
      self.showExpenseList();
    }, expandTime = expandTime || 5000);
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

// Условия при загрузке страницы
window.onload = function() {
  if(localStorage.currentLimit && localStorage.currentLimit > -30000) {
    simpl.init();
    simpl.currentLimit = localStorage.currentLimit;
    limitInputField.value = simpl.currentLimit;
  } else if(localStorage.currentLimit && localStorage.currentLimit < -30000) {
    simpl.countdownIsOn = false;
    simpl.togglePopUpView(endPopUp);
    simpl.endPopUpFill();
  } else if(localStorage.initialLimit) {
    simpl.init();
    simpl.initialLimit = localStorage.initialLimit;
    limitInputField.value = simpl.initialLimit;
  } else {
    simpl.controlsState();
  }
};

// Обработчики по кликам на кнопки
workingSpace.addEventListener('click', function(evt) {
  var id = evt.target.id;
  var popId = evt.target.dataset.popId;
  var popup = document.getElementById(popId);
  if(id === 'set-limit-btn' || id === 'reset-btn' || id === 'limit-subtract-btn' || id === 'restart-cancel') {
    simpl.togglePopUpView(popup);
  } else if(id === 'end-restart' || id === 'restart-confirm') {
    simpl.togglePopUpView(popup);
    simpl.restart();
  } else if(id === 'setlimit-cancel') {
    simpl.togglePopUpView(popup);
    setlimitField.value = '';
  } else if(id === 'setexpense-cancel') {
    simpl.togglePopUpView(popup);
    setExpenseValueField.value = '';
    setExpenseNameField.value = '';
  } else if(id === 'setlimit-submit') {
    simpl.setLimitPopUpFill();
    setlimitField.value = '';
  } else if(id === 'setexpense-submit') {
    simpl.setExpensePopUpFill();
    setExpenseValueField.value = '';
    setExpenseNameField.value = '';
  }
});

deadlineRange.addEventListener('input', function() {
  var rangeOutput = document.querySelector('#deadline-range-output');
  rangeOutput.innerHTML = deadlineRange.value;
});

// Цели

// 1. Имплементировать список покупок

// Баги

// 1. Разобраться с потерей контекста в методах countdownWork и showSystemMessage объекта simpl
// (в обоих случаях используется setTimeout) - решил с var self = this
//
//
