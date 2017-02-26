'use strict';

// screen.orientation.lock('portrait');

var SEC_IN_DAY = 86400;
var secInPassedDays = 86400;

var limitSubtractBtn = document.querySelector('#limit-subtract-btn'); // Кнопка списания
var setLimitBtn = document.querySelector('#set-limit-btn'); // Кнопка установки лимита
var limitInputField = document.querySelector('#limit-field'); // Поле с суммой
var resetBtn = document.querySelector('#reset-btn'); // Кнопка сброса
var adviserContainer = document.querySelector('#adviser-content-wrapper'); // Поле для вывода сообщений
var countdownContainer = document.getElementById('countdown'); // Поле с таймером
var initialBtns = document.querySelectorAll('.init-load-btn');
var subseqBtns = document.querySelectorAll('.subseq-load-btn');

var initialLimit, currentLimit, expense, endDeadLine, startDeadLine, deadLinePeriod, countdownIsOn, animateAdvise, messageHide;
var blinkingCursor = '<span class="blinking-cursor">&nbsp;</span>';

// Поп-ап финальный

var endPopUp = document.querySelector('#end-pop-up');
var endBtn = document.querySelector('#end-restart');
var endVerdict = document.querySelector('#end-verdict');
var endStat = document.querySelector('#end-stat');

// Поп-ап установка лимита

var setLimitPopUp = document.querySelector('#setlimit-pop-up');
var deadlineRange = document.querySelector('#deadline-range-field');
var deadlineRangeOutput = document.querySelector('#deadline-range-output');
var setLimitSubmit = document.querySelector('#setlimit-submit');
var setLimitCancel = document.querySelector('#setlimit-cancel');
var setlimitField = document.querySelector('#setlimit-field');

// Поп-ап подтверждение рестарта

var restartConfirmPopUp = document.querySelector('#rest-confirm-pop-up');
var restartConfirmBtn = document.querySelector('#restart-confirm');
var restartCancelBtn = document.querySelector('#restart-cancel');

// Поп-ап списание средств

var setExpensePopUp = document.querySelector('#setexpense-pop-up');
var setExpenseValueField = document.querySelector('#setexpense-value-field');
var setExpenseNameField = document.querySelector('#setexpense-name-field');
var setExpenseConfirmBtn = document.querySelector('#setexpense-submit');
var setExpenseCancelBtn = document.querySelector('#setexpense-cancel');

// Условия при загрузке страницы

window.onload = function() {
  if(localStorage.currentLimit && localStorage.currentLimit > -30000) {
    init();
    currentLimit = localStorage.currentLimit;
    limitInputField.value = currentLimit;
  } else if(localStorage.currentLimit && localStorage.currentLimit < -30000) {
    countdownIsOn = false;
    togglePopUpView(endPopUp);
    endPopUpFill();
  } else if(localStorage.initialLimit) {
    init();
    initialLimit = localStorage.initialLimit;
    limitInputField.value = initialLimit;
  } else {
    initialControlsState();
  }

};

// Обработчики по кликам на кнопки
// Три основные кнопки

setLimitBtn.addEventListener('click', function() {
  togglePopUpView(setLimitPopUp);
});

resetBtn.addEventListener('click', function() {
  togglePopUpView(restartConfirmPopUp);
});

limitSubtractBtn.addEventListener('click', function() {
  togglePopUpView(setExpensePopUp);
});

// Поп-ап финальный

endBtn.addEventListener('click', function() {
  togglePopUpView(endPopUp);
  restart();
});

// Поп-ап установка лимита

deadlineRange.addEventListener('input', function() {
  deadlineRangeOutput.innerHTML = deadlineRange.value;
});

setLimitSubmit.addEventListener('click', function() {
  setLimitPopUpFill(setLimit);
  setlimitField.value = '';
});

setLimitCancel.addEventListener('click', function() {
  togglePopUpView(setLimitPopUp);
  setlimitField.value = '';
});

// Поп-ап подтверждение рестарта

restartConfirmBtn.addEventListener('click', function() {
  togglePopUpView(restartConfirmPopUp);
  restart();
});

restartCancelBtn.addEventListener('click', function() {
  togglePopUpView(restartConfirmPopUp);
});

// Поп-ап подтверждение списания

setExpenseCancelBtn.addEventListener('click', function() {
  togglePopUpView(setExpensePopUp);
  setExpenseValueField.value = '';
  setExpenseNameField.value = '';
});

setExpenseConfirmBtn.addEventListener('click', function() {
  setExpensePopUpFill(limitSubtract);
  setExpenseValueField.value = '';
  setExpenseNameField.value = '';
});

// Запуск приложения при перезагрузке / закрытии браузера

function init() {
  inProcessControlsState();
  startDeadLine = new Date(Date.parse(localStorage.startDeadLine));
  endDeadLine = new Date(Date.parse(localStorage.endDeadLine));
  deadLinePeriod = localStorage.deadLinePeriod;
  secInPassedDays = localStorage.secInPassedDays;
  countdownIsOn = true;
  setColorIndicator();
  countdownWork();
  clearTimeout(showTimer);
  var showTimer = setTimeout(function() {
    countdownContainer.style.display = 'block';
  }, 1000);
}

// Активация / деактивация кнопок

function btnsStateToggle(btns, state) {
  for (var i = 0; i < btns.length; i++) {
    switch(state) {
      case 'disabled':
        btns[i].disabled = true;
        btns[i].classList.add('inactive');
        break;
      default:
        btns[i].disabled = false;
        btns[i].classList.remove('inactive');
    }
  }
}

function initialControlsState() {
  btnsStateToggle(initialBtns, 'enabled');
  btnsStateToggle(subseqBtns, 'disabled');
  limitInputField.style.fontSize = '0.85em';
}

function inProcessControlsState() {
  btnsStateToggle(initialBtns, 'disabled');
  btnsStateToggle(subseqBtns, 'enabled');
  limitInputField.style.fontSize = '1.25em';
}

// Первоначальная установка лимита

function setLimit() {
  cleanAdviser();
  if(checkLimit()) {
    inProcessControlsState();
    limitInputField.value = initialLimit;
    localStorage.setItem('initialLimit', initialLimit);
    localStorage.setItem('secInPassedDays', secInPassedDays);
    setInitialTimer();
    setTimeout(function() {
      countdownWork();
      countdownContainer.style.display = 'block';
    }, 1000);
    return initialLimit;
  } else {
    showSystemMessage(systemMessage.limitErrorTxt, systemMessage.messageType[0], 10000);
    return 'Значение некорректно';
  }
}

// Проверка правильности введенного значения - лимит

function checkLimit() {
  return deadLinePeriod && Number.isInteger(deadLinePeriod) && deadLinePeriod >= 1 && deadLinePeriod <= 7
  && initialLimit > 0 && Number.isInteger(initialLimit) && initialLimit < 30000;
}

// Обновление текущего лимита раз в сутки

function renewLimit(sum) {
  if(parseInt(localStorage.currentLimit, 10)) {
    currentLimit = parseInt(localStorage.currentLimit, 10);
  } else if(parseInt(localStorage.initialLimit, 10)) {
    currentLimit = parseInt(localStorage.initialLimit, 10);
  }
  currentLimit += sum;
  limitInputField.value = currentLimit;
  localStorage.setItem('currentLimit', currentLimit);
  setColorIndicator();
}

// Списание

function limitSubtract() {
  //cleanAdviser();
  if(checkExpense()) {

    if(localStorage.currentLimit) {
      currentLimit = localStorage.currentLimit;
    } else {
      currentLimit = initialLimit;
    }

    currentLimit -= expense;
    localStorage.setItem('currentLimit', currentLimit);
    limitInputField.value = currentLimit;
    addExpenseItem(setExpenseNameField.value);
    setColorIndicator();

    if (currentLimit < -30000) {
      countdownIsOn = false;
      togglePopUpView(endPopUp);
      endPopUpFill();
      return 'Вы превысили лимит';
    }

    return currentLimit;
  }
  showSystemMessage(systemMessage.expenseErrorTxt, systemMessage.messageType[0], 10000);
  return 'Значение некорректно';
}

// Проверка правильности введенного значения - списание

function checkExpense() {
  return expense && expense > 0 && Number.isInteger(expense) && expense < 30000;
}

// Рестарт приложения

function restart() {
  initialControlsState();
  countdownIsOn = false;
  cleanAdviser();
  localStorage.clear();
  initialLimit = currentLimit = limitInputField.value = setlimitField.value = startDeadLine = endDeadLine = deadLinePeriod = '';
  setExpensePopUp.style.display = restartConfirmPopUp.style.display = setLimitPopUp.style.display = 'none';
  secInPassedDays = 86400;
  setColorIndicator();
}

// Таймер

// Первоначальная установка таймера

function setInitialTimer() {
  startDeadLine = new Date();
  endDeadLine = new Date();
  localStorage.setItem('startDeadLine', startDeadLine);
  endDeadLine.setDate(startDeadLine.getDate() + deadLinePeriod);
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
      while( parseInt(localStorage.secInPassedDays, 10) < (deadLinePeriod * SEC_IN_DAY) && parseInt(localStorage.currentLimit, 10) + parseInt(localStorage.initialLimit, 10) < parseInt(localStorage.initialLimit, 10) * deadLinePeriod ) {
        renewLimit(parseInt(localStorage.initialLimit, 10));
        localStorage.setItem('secInPassedDays', secInPassedDays);
      }
      countdownIsOn = false;
      togglePopUpView(endPopUp);
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

    var timestr = thour + ':' + tmin + ':' + tsec;
    countdownContainer.innerHTML = timestr;

    setTimeout(function() {
      countdownWork();
    }, 1000);
  }
  return true;
}

// Объект с сообщениями

var systemMessage = {
  expenseErrorTxt: 'Значение некорректно. Допустимая сумма покупки - от 1 до 29999 ',
  limitErrorTxt: 'Значение некорректно. Допустимый лимит - от 1 до 29999. Допустимый период - от 1 до 7 дней ',
  messageType: ['error-message-open', 'regular-message-open']
};

// Массив со списком покупок

var purchaseArray = [];
var expenseList = document.createElement('ul');
expenseList.classList.add('expense-list');
adviserContainer.appendChild(expenseList);

// Наполнение массива с покупками

function addExpenseItem(expenseItem) {
  purchaseArray.unshift(expenseItem);
  var expenseListItem = document.createElement('li');
  var expenseText = document.createTextNode(purchaseArray[purchaseArray.indexOf(expenseItem)]);
  expenseListItem.appendChild(expenseText);
  expenseList.insertBefore(expenseListItem, expenseList.childNodes[0]);


  if(purchaseArray.length > 5) {
    purchaseArray.pop();
    expenseList.removeChild(expenseList.childNodes[5]);
  }
}

// Вывод системных сообщений (с анимацией)

function showSystemMessage(systemMessageText, messageType, expandTime) {
  var i = 0;
  animateAdvise = setInterval(function() {
    adviserContainer.innerHTML += systemMessageText[i];
    i++;
    if(i === systemMessageText.length) {
      clearInterval(animateAdvise);
      adviserContainer.innerHTML += blinkingCursor;
      adviserContainer.classList.add(messageType);
    }
  }, 25); // магическое число
  messageHide = setTimeout(function() {
    if(adviserContainer.classList.contains('error-message-open') || adviserContainer.classList.contains('regular-message-open')) {
      cleanAdviser();
    } else {
      clearTimeout(messageHide);
    }
  }, expandTime);
}

// Очистка поля сообщения

function cleanAdviser() {
  clearInterval(animateAdvise);
  clearTimeout(messageHide);
  adviserContainer.innerHTML = '';
  adviserContainer.className = '';
}

// Вывод и наполнение финального поп-апа

function endPopUpFill() {
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

// Задание значений для поп-апа установки лимита

function setLimitPopUpFill(callback) {
  initialLimit = parseInt(setlimitField.value, 10);
  deadLinePeriod = parseInt(deadlineRange.value, 10);
  togglePopUpView(setLimitPopUp);
  callback();
}

// Задание значений для поп-апа списания

function setExpensePopUpFill(callback) {
  expense = parseInt(setExpenseValueField.value, 10);
  togglePopUpView(setExpensePopUp);
  callback();
}

// Открытие поп-апа (универсальное)

function togglePopUpView(pop) {
  pop.style.display = pop.style.display === 'flex' ? '' : 'flex';
}

// Добавление полю limitInputField класса при отрицательном балансе

function setColorIndicator() {
  if(parseInt(localStorage.currentLimit, 10) < 0) {
    limitInputField.classList.add('negative-balance');
  } else {
    limitInputField.classList.remove('negative-balance');
  }
}

// BUGS / ERRORS

// 1) В конце при определенных условиях (длительный период бездействия, загрузка страница когда цикл уже закончен) - done

// FEATURES

// 1) Список трат с описанием. Небольшой блок - максимум описание трех покупок. Каждая последующая встает в начало списка,
// самое нижнее при этом удаляется. (массив?)
// 2) Оставить только портретную ориентацию для мобильных устройств.


// Механизм добавления/удаления объекта из массива - done
// Дорабокта поп-апа - значение из инпута попадает в список - done
// Сохранение в локал сторож и подгрузка из него при открытии страницы
// При рестарте все сбрасывается
//
//
