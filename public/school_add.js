var database = firebase.database();

var schools = [];
var cities = {};
var provinces = [];

var school = {};

var studentData = {};
var count;

var startdate;

database.ref('/school').on('value', function (snapshot) {
  schools = snapshot.val();
});

database.ref('/cities').once('value', function (snapshot) {
  var list = snapshot.val();
  cities = {};
  for (var i = 0; i < list.length; i++) {
    if (!cities[list[i].province]) {
      cities[list[i].province] = [];
      provinces.push(list[i].province);
    }
    cities[list[i].province].push({
      name: list[i].city,
      value: Number(list[i].city_id)
    });
  }
  $('#province').html('<option value="" selected disabled class="invalid">광역시/도</option>');
  for (var i = 0; i < provinces.length; i++) {
    $('#province').append('<option value="' + i + '">' + provinces[i] + '</option>');
  }
  $('select').material_select();
});


$('#province').change(function () {
  var prov = $('#province option:selected').text();
  $('#city').html();
  for (var i = 0; i < cities[prov].length; i++) {
    $('#city').append('<option value="' + cities[prov][i].value + '">' + cities[prov][i].name + '</option>');
  }
  $('#city').material_select();
});

function upload(data) {
  var name = data.name + ' (' + data.city + ')';
  database.ref('/school/' + schools.length).set({
    id: schools.length,
    city_id: data.city_id,
    name: name,
    count: 0
  }, function (err) {
    if(err) {
      console.log(err);
      alert('오류가 발생했습니다. 잠시 후 다시 시도하시거나 페이지를 새로고침해 주세요.\n');
    } else {
      alert('등록이 완료되었습니다!');
      $('input').val('');
      $('textarea').val('');
      $('input:checked').prop('checked', false);
    }
  });
}

function sendData() {
  var schoolData = {
    city_id: Number($('#city option:selected').val()),
    city: $('#city option:selected').text(),
    name: $('#name').val()
  };
  upload(schoolData);
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}