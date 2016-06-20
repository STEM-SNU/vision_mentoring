var database = firebase.database();

var schools_source = schools.map(function(x,i) {
  return {
    value: x[0],
    id: i,
    city: x[1]
  };
});

var school = {};
var studentData = {};
var count;

$(document).ready(function () {
  $('select').material_select();

  $('#school').autocomplete({
    minLength: 2,
    source: schools_source,
    select: function(event, ui) {
      school = ui.item;
      $('#school').val(school.value)
    },
    change: function (event, ui) {
      if(!ui.item) {
        $(event.target).val('');
        $(event.target).addClass('invalid');
      }
      else {
        $(event.target).removeClass('invalid');
        firebase.database().ref('/school/' + ui.item.id + '/count').once('value', function(snapshot) {
          count = Number(snapshot.val()) + 1;
          if (count > 20) {
            $("#quota").html('<small>정원 초과!</small><br>' + count + '/20명');
            $("#quota").addClass("red-text");
          } else {
            $("#quota").removeClass("red-text");
            $("#quota").html('<br>' + count + '/20명');
          }
        });
      }
    }
  });
  firebase.database().ref('/count').on('value', function (snapshot) {
    if (snapshot.val() > 1600) {
      $('#finished').show();
      $('#register').hide();
    } else {
      $('#finished').hide();
      $('#register').show();
      $('#realtime_count').text('현재 ' + snapshot.val() + '명 접수');
    }

  });
  $('#grade').change(function (event) {
    $('input', $('#grade').parent()).removeClass('invalid').css('color','rgba(0, 0, 0, 0.87)');
  });
  $('#phone').change(function (event) {
    $('#phone').next().attr('data-error', '잘못된 연락처 형식입니다. (010-XXXX-XXXX)');
  });

  console.log("콘솔 열지 마세요....... Bug report to: kakao @stemsnu");
});

function validateData() {
  var form = $('#basic-info');

  var validated = true;

  var name = $('#name').val();
  if (name.length < 2) {
    $('#name').addClass('invalid');
    validated = false;
  }
  $('#school').val(school.value);
  if (school.id === undefined) {
    $('#school').addClass('invalid');
    validated = false;
  }
  var grade = $('#grade option:selected').val();
  if (grade === '') {
    $('input', $('#grade').parent()).addClass('invalid').css('color','rgb(244, 67, 54)');
    validated = false;
  } else {
    grade = Number(grade);
    $('input', $('#grade').parent()).removeClass('invalid').css('color','rgba(0, 0, 0, 0.87)');
  }
  var email = $('#email').val();
  if (email.length === 0 || !$('#email')[0].validity.valid) {
    $('#email').addClass('invalid');
    validated = false;
  }
  var phone = $('#phone').val();
  if (phone.length === 0 || !$('#phone')[0].validity.valid) {
    $('#phone').addClass('invalid');
    $('#phone').next().attr('data-error', '잘못된 연락처 형식입니다. (010-XXXX-XXXX)');
    validated = false;
  }
  var guardianName = $('#guardian_name').val();
  if (guardianName.length < 2) {
    $('#guardian_name').addClass('invalid');
    validated = false;
  }
  var guardianPhone = $('#guardian_phone').val();
  if (guardianPhone.length === 0 || !$('#guardian_phone')[0].validity.valid) {
    $('#guardian_phone').addClass('invalid');
    validated = false;
  }
  phone = phone.replace(/[^0-9]/g,'');
  guardianPhone = guardianPhone.replace(/[^0-9]/g,'');



  if (validated) {
    studentData = {
      name: name,
      school: school,
      grade: Number(grade),
      email: email,
      phone: phone,
      guardian_name: guardianName,
      guardian_phone: guardianPhone
    }
    return firebase.database().ref('/students').orderByChild('phone').equalTo(phone).once('value');
  } else location.href = '#start';
  return;
}

function checkResponse() {
  var result = validateData();
  if (result === undefined) return;
  result.then(function (snapshot) {
    if(snapshot.val() !== null) {
      $('#phone').addClass('invalid');
      $('#phone').next().attr('data-error', '이미 참가 등록된 연락처입니다.');
      location.href = '#start';
    } else location.href = '#register-2';
  });
}

function upload(data) {
  firebase.database().ref('/school/' + data.school.id).once('value', function(snapshot) {
    var school_data = snapshot.val()
    var students = school_data.students;
    var idx = school_data.count;
    data.order = Number(idx) + 1;
    firebase.database().ref('/school/' + data.school.id + '/students/' + idx).set({
        name: data.name,
        grade: data.grade,
        email: data.email,
        guardian_name: data.guardian_name,
        phone: data.phone,
        interests: data.interests,
        motivation: data.motivation,
        timestamp: data.timestamp,
        order: data.order
    }, function(err) {
      if(err) {
        console.log(err);
        alert('접수 중 오류가 발생했습니다. 잠시 후 다시 시도하시거나 페이지를 새로고침해 주세요.\n' +
          '지속적인 문제 발생 시 카톡 @stemsnu 또는 홈페이지(honor.snu.ac.kr)의 자유게시판에 문의해주시기 바랍니다.');
      } else {
        firebase.database().ref('/school/' + data.school.id).update({count: school_data.count + 1});
        if (data.order <= 20) {
          firebase.database().ref('/count').once('value', function(snapshot) {
            firebase.database().ref('/count').set(snapshot.val() + 1);
          });
        }
        firebase.database().ref('/students').push(data, function(err) {
          if(err) {
            console.log(err);
            alert('접수 중 오류가 발생했습니다. 잠시 후 다시 시도하시거나 페이지를 새로고침해 주세요.\n' +
            '지속적인 문제 발생 시 카톡 @stemsnu 또는 홈페이지(honor.snu.ac.kr)의 자유게시판에 문의해주시기 바랍니다.');
          } else {
            $('input').val('');
            $('textarea').val('');
            $('input:checked').prop('checked', false);
            if (data.order <= 20) {
              if(confirm('접수가 완료되었습니다!\n' +
                '확인을 누르시면 접수 확인 페이지로 이동합니다.')) {
                location.href = 'confirm.html?name=' + encodeURIComponent(data.name) +
                                  '&phone=' + encodeURIComponent(data.phone);
              }
            } else {
              if(confirm('대기번호가 발급되었습니다.\n' +
                '확인을 누르시면 대기번호 확인 페이지로 이동합니다.')) {
                location.href = 'confirm.html?name=' + encodeURIComponent(data.name) +
                                  '&phone=' + encodeURIComponent(data.phone);
              }
            }
          }
        });
      }
    });
  });
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