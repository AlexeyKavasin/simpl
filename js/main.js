'use strict';

var simpl = {
  // первоначальные значения для установки лимита
  setLimitPopUpFill: function() {
    initialLimit = parseInt(setlimitField.value, 10);
    deadLinePeriod = parseInt(deadlineRange.value, 10);
    this.togglePopUpView(setLimitPopUp);
    this.setLimit();
  },
  // первоначальная установка лимита
  setLimit: function() {
    this.cleanAdviser();
    if(deadLinePeriod < 1 || deadLinePeriod > 9 || initialLimit < 0 || isNaN(initialLimit) || initialLimit > 30000) {
      showSystemMessage(systemMessage.limitErrorTxt, systemMessage.messageType[0], 10000);
      return 'Значение некорректно';
    }
    limitInputField.value = initialLimit;
    localStorage.setItem('initialLimit', initialLimit);
    localStorage.setItem('secInPassedDays', secInPassedDays);
    setInitialTimer();
    setTimeout(function() {
      countdownWork();
      countdownContainer.style.display = 'block';
    }, 1000);
    this.controlsState();
    return initialLimit;
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

    if(!countdownIsOn) {
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
    clearInterval(animateAdvise);
    clearTimeout(messageHide);
    adviserContainer.innerHTML = '';
    adviserContainer.className = '';
  },
  // cписание средств
  limitSubtract: function() {
    if(Number.isInteger(expense) && expense > 0 && expense < 30000) {
      currentLimit = localStorage.currentLimit || initialLimit;
      currentLimit -= expense;
      localStorage.setItem('currentLimit', currentLimit);
      limitInputField.value = currentLimit;
      //addExpenseItem(setExpenseNameField.value);
      this.checkColorIndicator();

      if(currentLimit < -30000) {
        countdownIsOn = false;
        this.togglePopUpView(endPopUp);
        endPopUpFill();
        return 'Вы превысили лимит';
      }

      return currentLimit;
    } else {
      showSystemMessage(systemMessage.expenseErrorTxt, systemMessage.messageType[0], 10000);
      return 'Значение некорректно';
    }
  },
  // значения для списания
  setExpensePopUpFill: function() {
    expense = parseInt(setExpenseValueField.value, 10);
    this.togglePopUpView(setExpensePopUp);
    this.limitSubtract();
  }
};

var SEC_IN_DAY = 86400;
var secInPassedDays = 86400;

var workingSpace = document.querySelector('#main');
var limitInputField = document.querySelector('#limit-field'); // Поле с суммой
var adviserContainer = document.querySelector('#adviser-content-wrapper'); // Поле для вывода сообщений
var countdownContainer = document.getElementById('countdown'); // Поле с таймером
var initialLimit, currentLimit, expense, endDeadLine, startDeadLine, deadLinePeriod, animateAdvise, messageHide;
var countdownIsOn = countdownIsOn || false;

// Поп-ап финальный

var endPopUp = document.querySelector('#end-pop-up');

// Поп-ап установка лимита

var setLimitPopUp = document.querySelector('#setlimit-pop-up');
var deadlineRange = document.querySelector('#deadline-range-field');
var setlimitField = document.querySelector('#setlimit-field');

// Поп-ап подтверждение рестарта

var restartConfirmPopUp = document.querySelector('#rest-confirm-pop-up');

// Поп-ап списание средств

var setExpensePopUp = document.querySelector('#setexpense-pop-up');
var setExpenseValueField = document.querySelector('#setexpense-value-field');
var setExpenseNameField = document.querySelector('#setexpense-name-field');

// Условия при загрузке страницы

window.onload = function() {
  if(localStorage.currentLimit && localStorage.currentLimit > -30000) {
    init();
    currentLimit = localStorage.currentLimit;
    limitInputField.value = currentLimit;
  } else if(localStorage.currentLimit && localStorage.currentLimit < -30000) {
    countdownIsOn = false;
    simpl.togglePopUpView(endPopUp);
    endPopUpFill();
  } else if(localStorage.initialLimit) {
    init();
    initialLimit = localStorage.initialLimit;
    limitInputField.value = initialLimit;
  } else {
    simpl.controlsState();
  }
};

// Запуск приложения при повтороной загрузке

function init() {
  startDeadLine = new Date(Date.parse(localStorage.startDeadLine));
  endDeadLine = new Date(Date.parse(localStorage.endDeadLine));
  deadLinePeriod = localStorage.deadLinePeriod;
  secInPassedDays = localStorage.secInPassedDays;
  countdownIsOn = true;
  simpl.controlsState();
  simpl.checkColorIndicator();
  countdownWork();
  clearTimeout(showTimer);
  var showTimer = setTimeout(function() {
    countdownContainer.style.display = 'block';
  }, 1000);
}

// Обновление текущего лимита раз в сутки

function renewLimit(sum) {
  currentLimit = parseInt(localStorage.currentLimit, 10) || parseInt(localStorage.initialLimit, 10);
  currentLimit += sum;
  limitInputField.value = currentLimit;
  localStorage.setItem('currentLimit', currentLimit);
  simpl.checkColorIndicator();
}

// Рестарт приложения

function restart() {
  countdownIsOn = false;
  simpl.controlsState();
  simpl.cleanAdviser();
  localStorage.clear();
  initialLimit = currentLimit = limitInputField.value = setlimitField.value = startDeadLine = endDeadLine = deadLinePeriod = '';
  setExpensePopUp.style.display = restartConfirmPopUp.style.display = setLimitPopUp.style.display = 'none';
  secInPassedDays = 86400;
  simpl.checkColorIndicator();
}

// Таймер

// Первоначальная установка таймера

function setInitialTimer() {
  startDeadLine = new Date();
  endDeadLine = new Date();
  endDeadLine.setDate(startDeadLine.getDate() + deadLinePeriod);
  localStorage.setItem('startDeadLine', startDeadLine);
  localStorage.setItem('endDeadLine', endDeadLine);
  localStorage.setItem('deadLinePeriod', deadLinePeriod);
  countdownIsOn = true;
}

// Запуск и работа таймера

function countdownWork() {
  if(!countdownIsOn) {
    countdownContainer.innerHTML = '';
  } else {
    var now = new Date();
    now = Math.floor((endDeadLine - now) / 1000);

    if(now <= 0) {
      // до тех пор пока текущее прошедшее время меньше установленного срока
      // и сумма текущего и первоначального лимита не превышает максимально возможной на балансе суммы
      // обновляем баланс на фиксированную сумму
      while( parseInt(localStorage.secInPassedDays, 10) < (deadLinePeriod * SEC_IN_DAY) &&
        parseInt(localStorage.currentLimit, 10) + parseInt(localStorage.initialLimit, 10) < parseInt(localStorage.initialLimit, 10) * deadLinePeriod ) {
        renewLimit(parseInt(localStorage.initialLimit, 10));
        localStorage.setItem('secInPassedDays', secInPassedDays);
      }
      countdownIsOn = false;
      simpl.togglePopUpView(endPopUp);
      endPopUpFill();
      return false;
    }

    if( ((deadLinePeriod * SEC_IN_DAY) - now) > parseInt(localStorage.secInPassedDays, 10) && now > 0 ) {
      renewLimit(parseInt(localStorage.initialLimit, 10));
      secInPassedDays = parseInt(localStorage.secInPassedDays, 10);
      secInPassedDays += SEC_IN_DAY;
      localStorage.setItem('secInPassedDays', secInPassedDays);
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
    var thour = now % (24 * deadLinePeriod);
    now = Math.floor(now / 24);
    if(thour < 10) {
      thour = '0' + thour;
    }

    countdownContainer.innerHTML = thour + ':' + tmin + ':' + tsec;

    setTimeout(function() {
      countdownWork();
    }, 1000);
  }
  return true;
}

// Объект с сообщениями

var systemMessage = {
  expenseErrorTxt: 'Значение некорректно. Допустимая сумма покупки - от 1 до 29999 ',
  limitErrorTxt: 'Значение некорректно. Допустимый лимит - от 1 до 29999. Допустимый период - от 1 до 9 дней ',
  messageType: ['error-message-open', 'regular-message-open']
};

// (временно задизейблено)

// Массив со списком покупок

// var purchaseArray = [];
// var expenseList = document.createElement('ul');
// expenseList.classList.add('expense-list');
// adviserContainer.appendChild(expenseList);

// Наполнение массива с покупками

// function addExpenseItem(expenseItem) {
//   purchaseArray.unshift(expenseItem);
//   var expenseListItem = document.createElement('li');
//   var expenseText = document.createTextNode(purchaseArray[purchaseArray.indexOf(expenseItem)]);
//   expenseListItem.appendChild(expenseText);
//   expenseList.insertBefore(expenseListItem, expenseList.childNodes[0]);


//   if(purchaseArray.length > 5) {
//     purchaseArray.pop();
//     expenseList.removeChild(expenseList.childNodes[5]);
//   }
// }

// Вывод системных сообщений (с анимацией)

function showSystemMessage(systemMessageText, messageType, expandTime) {
  var i = 0;
  var blinkingCursor = '<span class="blinking-cursor">&nbsp;</span>';
  simpl.cleanAdviser();
  animateAdvise = setInterval(function() {
    adviserContainer.innerHTML += systemMessageText[i];
    i++;
    if(i === systemMessageText.length) {
      clearInterval(animateAdvise);
      adviserContainer.innerHTML += blinkingCursor;
      adviserContainer.classList.add(messageType);
    }
  }, 20); // магическое число
  messageHide = setTimeout(function() {
    simpl.cleanAdviser();
  }, expandTime = expandTime || 5000);
}

// Вывод и наполнение финального поп-апа

function endPopUpFill() {
  var endVerdict = document.querySelector('#end-verdict');
  var endStat = document.querySelector('#end-stat');
  initialLimit = parseInt(localStorage.initialLimit, 10);
  currentLimit = parseInt(localStorage.currentLimit, 10);
  deadLinePeriod = parseInt(localStorage.deadLinePeriod, 10);
  limitInputField.value = currentLimit;

  if(!currentLimit || currentLimit > -30000) {
    endVerdict.innerHTML = '<p>Время истекло</p><br>';
  } else {
    endVerdict.innerHTML = '<p>Превышен лимит трат</p><br>';
  }

  if(!currentLimit || currentLimit === initialLimit * deadLinePeriod) {
    endStat.innerHTML =
    '<p>Дневной лимит: ' + initialLimit + '</p>' +
    '<p>Период (в днях): ' + deadLinePeriod + '</p>' +
    '<p>Потрачено за период: 0</p>' +
    '<p>Сэкономлено: ' + initialLimit + '</p>' +
    '<p>Возможно, вы не записывали свои расходы. Попробуйте еще раз.</p>';
  } else if(currentLimit < 0) {
    endStat.innerHTML =
    '<p>Дневной лимит: ' + initialLimit + '</p>' +
    '<p>Период (в днях): ' + deadLinePeriod + '</p>' +
    '<p>Потрачено за период: ' + ((initialLimit * deadLinePeriod) + Math.abs(currentLimit)) + '</p>' +
    '<p>Перерасход составил: ' + Math.abs(currentLimit) + '</p>' +
    '<p>Попробуйте еще раз.</p>';
  } else {
    endStat.innerHTML =
    '<p>Дневной лимит: ' + initialLimit + '</p>' +
    '<p>Период (в днях): ' + deadLinePeriod + '</p>' +
    '<p>Потрачено за период: ' + ((initialLimit * deadLinePeriod) - currentLimit) + '</p>' +
    '<p>Сэкономлено: ' + currentLimit + '</p>' +
    '<p>Попробуйте еще раз.</p>';
  }
}

// Обработчики по кликам на кнопки

workingSpace.addEventListener('click', function(evt) {
  var id = evt.target.id;
  var popId = evt.target.dataset.popId;
  var popup = document.getElementById(popId);

  if(id === 'set-limit-btn' || id === 'reset-btn' || id === 'limit-subtract-btn' || id === 'restart-cancel') {
    simpl.togglePopUpView(popup);
  } else if(id === 'end-restart' || id === 'restart-confirm') {
    simpl.togglePopUpView(popup);
    restart();
  } else if(id === 'setlimit-cancel') {
    simpl.togglePopUpView(popup);
    setlimitField.value = '';
  } else if(id === 'setexpense-cancel') {
    simpl.togglePopUpView(popup);
    setExpenseValueField.value = '';
    setExpenseNameField.value = '';
  } else if(id === 'setlimit-submit') {
    simpl.setLimitPopUpFill(simpl.setLimit);
    setlimitField.value = '';
  } else if(id === 'setexpense-submit') {
    simpl.setExpensePopUpFill();
    setExpenseValueField.value = '';
    setExpenseNameField.value = '';
  }
});

// Поп-ап установка лимита

deadlineRange.addEventListener('input', function() {
  var deadlineRangeOutput = document.querySelector('#deadline-range-output');
  deadlineRangeOutput.innerHTML = deadlineRange.value;
});

// Цели

// 1. Максимально спрятать глобальные переменные

// Баги

// 1. Системный текст в поле сообщений не перезаписывается, а добавляется один к другому (исправлено - функция cleanAdviser перенесена выше по коду)
