var database = firebase.database();

var school = {};
var studentData = {};

$(document).ready(function () {
  $('#phone').change(function (event) {
    $('#phone').next().attr('data-error', '잘못된 연락처 형식입니다. (010-XXXX-XXXX)');
  });
  $('#name').change(function (event) {
    $('#name').next().attr('data-error', '실명을 정확히 입력해주세요.');
  });
  var data = location.href.split('?')[1];
  var dict = {};
  if(data) {
    data = data.split('&').map(function(d) {
      var tmp=d.split('=');
      dict[tmp[0]] = tmp[1];
    });
    if(dict.name && dict.phone) {
      $('#name').val(decodeURIComponent(dict.name));
      $('#name').change();
      $('#phone').val(decodeURIComponent(dict.phone));
      $('#phone').change();
      checkResponse();
    }
  }
  console.log("콘솔 열지 마세요....... Bug report to: kakao @stemsnu");
});

function validateData() {
  var validated = true;

  var name = $('#name').val();
  if (name.length < 2) {
    $('#name').addClass('invalid');
    validated = false;
  }
  var phone = $('#phone').val();
  if (phone.length === 0 || !$('#phone')[0].validity.valid) {
    $('#phone').addClass('invalid');
    $('#phone').next().attr('data-error', '잘못된 연락처 형식입니다. (010-XXXX-XXXX)');
    validated = false;
  }
  phone = phone.replace(/[^0-9]/g,'');

  if (validated) {
    return firebase.database().ref('/students').orderByChild('phone').equalTo(phone).once('value');
  } else location.href = '#start';
  return;
}

function checkResponse() {
  var result = validateData();
  if (result === undefined) return;
  result.then(function (snapshot) {
    if(snapshot.val() !== null) {
      var student = snapshot.val();
      var key = Object.keys(student)[0];
      student = student[key];
      if (student.name !== $('#name').val().trim()) {
        $('#name').addClass('invalid');
        $('#name').next().attr('data-error', '등록되지 않은 학생입니다.');
        return;
      }
      $("#name-display").text(student.name);
      var schoolText = student.school.value;
      if (student.grade <= 3) schoolText += ', ' + student.grade + '학년';
      else schoolText += ' 졸업';
      var qrdata = 'https://honor.snu.ac.kr/vm_confirm?key=' + key;
      $("#school").text(schoolText);
      if (student.order > 20 && !student.confirmed) {
        $("#qrcode img").attr('src', 'pending.png');
      } else {
        $("#qrcode img").attr('src', 'https://chart.googleapis.com' +
                                '/chart?cht=qr&chs=400x400&chl=' +
                                encodeURIComponent(qrdata));
      }
      $("#register-info").show();
      $("#search").hide();
    } else {
      $('#phone').addClass('invalid');
      $('#phone').next().attr('data-error', '등록되지 않은 연락처입니다.');
    }
  });
}

function upload(data) {
  firebase.database().ref('/school/' + data.school.id).once('value', function(snapshot) {
    var school_data = snapshot.val()
    var students = school_data.students;
    var idx = school_data.count;
    firebase.database().ref('/school/' + data.school.id + '/students/' + idx).set({
        name: data.name,
        grade: data.grade,
        email: data.email,
        guardian_name: data.guardian_name,
        phone: data.phone,
        interests: data.interests,
        motivation: data.motivation,
        timestamp: data.timestamp
    }, function(err) {
      if(err) {
        console.log(err);
        alert('접수 중 오류가 발생했습니다. 잠시 후 다시 시도하시거나 페이지를 새로고침해 주세요.\n' +
          '지속적인 문제 발생 시 카톡 @stemsnu 또는 홈페이지(honor.snu.ac.kr)의 자유게시판에 문의해주시기 바랍니다.');
      } else {
        alert('접수가 완료되었습니다!');
        $('input').val('');
        $('textarea').val('');
        $('input:checked').prop('checked', false);
      }
    });

    firebase.database().ref('/school/' + data.school.id).update({count: school_data.count + 1});
    firebase.database().ref('/count').once('value', function(snapshot) {
      firebase.database().ref('/count').set(snapshot.val() + 1);
    });
  });
  firebase.database().ref().child('students').push(data);
}

function sendData() {
  var result = validateData();
  if (result === undefined) return;
  result.then(function (snapshot) {    if(snapshot.val() !== null) {
      $('#phone').addClass('invalid');
      $('#phone').next().attr('data-error', '이미 참가 등록된 연락처입니다.');
      location.href = '#start';
      return;
    }
    var selected = [];
    $('#interests input:checked').each(function (i, e) {
      if ($(e).attr('id') === 'Other') {
        selected.push('Other.' + $('#other_interest').val());
      } else {
        selected.push($(e).attr('id'));
      }
    });
    selected = selected.join('|');
    studentData.timestamp = (new Date()).toISOString();
    studentData.interests = selected;
    studentData.motivation = $('#motivation').val();
    if (selected === '' || studentData.motivation.trim() === '') {
      if (!confirm('추가 설문을 작성하지 않으셨습니다!\n' +
        '관심 학과와 지원 동기를 작성하지 않고 그대로 제출하시겠습니까?')) {

        location.href = '#register-2';
        return;
      }
    }
    if (count > 20) {
      alert('20명이 넘을 시 접수하여도 참여가 불가능할 수 있습니다.');
    }
    upload(studentData);
  });

}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}