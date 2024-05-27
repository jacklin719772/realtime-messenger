export function timestampToElapsed(timestamp) {
  var elapsed = '';
  var date = new Date(timestamp);
  var seconds = new Date().getTime() - date.getTime();

  seconds = Math.floor(seconds / 1000);

  if (seconds < 60) {
    elapsed = 'Just now';
  } else if (seconds < 60 * 60) {
    var minutes = Math.floor(seconds / 60);
    var text = minutes > 1 ? 'mins' : 'min';
    elapsed = minutes + ' ' + text;
  } else if (seconds < 24 * 60 * 60) {
    var hours = Math.floor(seconds / (60 * 60));
    var text = hours > 1 ? 'hours' : 'hour';
    elapsed = hours + ' ' + text;
  } else {
    var days = Math.floor(seconds / (24 * 60 * 60));
    var text = days > 1 ? 'days' : 'day';
    elapsed = days + ' ' + text;
  }

  return elapsed;
}

export function componentsToBirthDate(date) {
  const day = `0${date.getDate()}`.slice(-2);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

export function todayToReverse() {
  const time = Math.floor(new Date().getTime() / 1000);
  const original = time.toString();

  let reverse = '';
  for (var i = original.length - 1; i >= 0; i--) {
    reverse += original[i];
  }

  return reverse;
}

// Convert milliseconds to seconds
export function msToSeconds(ms) {
  return Math.floor(ms / 1000);
}

function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}

export function convertMsToTime(milliseconds) {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  return `${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
}

export function formatMs(milliseconds) {
  let ms = milliseconds;
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);

  ms = milliseconds % 1000;
  seconds = seconds % 60;
  minutes = minutes % 60;

  return `${padTo2Digits(minutes)}:${padTo2Digits(seconds)}:${padTo2Digits(
    ms,
  ).slice(0, 2)}`;
}

export function getPassedDays(timestamp) {
  const d = new Date(timestamp);
  d.setHours(d.getHours() + 8);
  const today = new Date(new Date().toDateString());
  const dDate = new Date(d.toDateString());
  const dateDifference = Math.floor((today - dDate) / 86400000);
  if (dateDifference === 0) {
    return 'Today';
  }
  if (dateDifference === 1) {
    return 'Yesterday';
  }
  return dateDifference + ' days ago';
}

export const getFormattedTime = (str) => {
  const d = new Date(str);
  d?.setHours(d?.getHours() + 8);
  const formattedTime = d?.toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit'});
  return formattedTime;
}

export const equalDate = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1?.setHours(d1?.getHours() + 8);
  d2?.setHours(d2?.getHours() + 8);
  return d1?.getDate() === d2?.getDate();
}

export const getFormattedDate = (date) => {
  const d = new Date(date);
  d?.setHours(d?.getHours() + 8);
  const today = new Date(new Date().toDateString());
  const dDate = new Date(d.toDateString());
  if (Math.floor((today - dDate) / 86400000) === 0) {
    return 'Today';
  }
  if (Math.floor((today - dDate) / 86400000) === 1) {
    return 'Yesterday';
  }
  return d?.toLocaleDateString([], { year:"numeric", day:"numeric", month:"long"});
}

export const getFileSize = (byte) => {
  if (byte < 1024) {
    return byte + ' B';
  } else if ((byte / 1024) < 1024) {
    return (byte / 1024).toFixed(2) + ' KB';
  } else if ((byte / 1024 / 1024) < 1024) {
    return (byte / 1024 / 1024).toFixed(2) + ' MB';
  } else {
    return (byte / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }
}
