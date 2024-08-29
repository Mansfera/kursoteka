function setUsetData(login, password, username, expire_date, allowedTests) {
  fetch("/api/changeUserData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      login,
      password,
      username,
      expire_date,
      allowedTests,
    }),
  })
    .then((response) => {
      switch (response.status) {
        case 200: {
          document
            .getElementById("save_user_" + username)
            .classList.add("green-bg");
          document.getElementById("save_user_" + username).innerHTML = "✅";
          setTimeout(
            getUsers(getCookie("login"), getCookie("password")),
            2 * 1000
          );
          break;
        }
      }
      return response.json();
    })
    .catch((error) => {
      console.log(error.message);
    });
}
function deleteUser(login, password, username) {
  fetch("/api/deleteUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      login,
      password,
      username,
    }),
  })
    .then((response) => {
      switch (response.status) {
        case 200: {
          var element = document.getElementById("user_" + username);
          element.parentNode.removeChild(element);
          getUsers(getCookie("login"), getCookie("password"));
          break;
        }
      }
      return response.json();
    })
    .catch((error) => {
      console.log(error.message);
    });
}
function createUserDiv(login) {
  let newDiv = document.createElement("div");
  newDiv.className = "list-element";
  newDiv.id = `user_${login.toString()}`;
  newDiv.innerHTML = `
        <div class="list-element__info" id="staus_field_${login.toString()}">
            <div class="user-status__text">Статус:</div>
            <div id="status_user_${login.toString()}"></div>
        </div>
        <div class="list-element__info credentials">
            <div class="user-login__text">Імʼя:</div>
            <div id="login_user_${login.toString()}">${login.toString()}</div>
        </div>
        <div class="list-element__info stats" id="stats_${login.toString()}">
            <div class="stats__text">Статистика</div>
        </div>
        <div class="list-element__info expire-date" id="expire_date_field">
            <input type="datetime-local" class="datePicker" id="datePicker_user_${login.toString()}" />
        </div>
        <div class="list-element__info test-access">
            <input type="text" class="testPicker" id="testPicker_user_${login.toString()}" placeholder="1,2,3...31,32" />
        </div>
        <div class="list-element__info user-buttons">
            <div class="button user-btn" id="save_user_${login.toString()}">Зберегти</div>
            <div class="button user-btn red-bg" id="delete_user_${login.toString()}">Видалити</div>
        </div>
    `;
  return newDiv;
}
function getUsers(login, password) {
  fetch("/api/getUsers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ login, password }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Invalid login or password");
      }
      return response.json();
    })
    .then((data) => {
      let students = data.students;
      document.getElementById("userList").innerHTML = "";
      Array.from(students).forEach((user) => {
        let newUserDiv = createUserDiv(user.login);
        document.getElementById("userList").appendChild(newUserDiv);
        if (new Date(user.expire_date) - Date.now() / 1000 >= 86400) {
          document
            .getElementById("staus_field_" + user.login)
            .classList.add("green-bg");
          document.getElementById("status_user_" + user.login).innerHTML =
            "Доступ є";
        }
        if (
          new Date(user.expire_date) - Date.now() / 1000 < 86400 &&
          new Date(user.expire_date) - Date.now() / 1000 >= 0
        ) {
          document
            .getElementById("staus_field_" + user.login)
            .classList.add("yellow-bg");
          document.getElementById("status_user_" + user.login).innerHTML =
            "Доступ закінчується";
        }
        if (new Date(user.expire_date) - Date.now() / 1000 < 0) {
          document
            .getElementById("staus_field_" + user.login)
            .classList.add("red-bg");
          document.getElementById("status_user_" + user.login).innerHTML =
            "Доступу немає";
        }
        const dateValue = new Date(user.expire_date * 1000);
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, "0"); // Months are 0-based in JavaScript
        const day = String(dateValue.getDate()).padStart(2, "0");
        const hours = String(dateValue.getHours()).padStart(2, "0");
        const minutes = String(dateValue.getMinutes()).padStart(2, "0");
        const localISODate = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById("datePicker_user_" + user.login).value =
          localISODate;
        document.getElementById("testPicker_user_" + user.login).value =
          user.allowedTests.toString();
        document
          .getElementById("save_user_" + user.login)
          .addEventListener("click", () => {
            if (
              !document
                .getElementById("save_user_" + user.login)
                .classList.contains("green-bg")
            ) {
              setUsetData(
                getCookie("login"),
                getCookie("password"),
                user.login,
                Math.floor(
                  new Date(
                    document.getElementById(
                      "datePicker_user_" + user.login
                    ).value
                  ).getTime() / 1000
                ),
                document
                  .getElementById("testPicker_user_" + user.login)
                  .value.replace(" ", "")
                  .split(",")
                  .map((item) => (isNaN(item) ? item : parseInt(item)))
              );
            }
          });
        document
          .getElementById("delete_user_" + user.login)
          .addEventListener("click", () => {
            if (
              !document
                .getElementById("delete_user_" + user.login)
                .classList.contains("green-bg")
            ) {
              deleteUser(getCookie("login"), getCookie("password"), user.login);
            }
          });
        document
          .getElementById("stats_" + user.login)
          .addEventListener("click", () => {
            current_stats_user = user;
            const startDatePicker = document.getElementById("stats-start_date");
            const endDatePicker = document.getElementById("stats-end_date");
            const joinDate = new Date(user.join_date);

            startDatePicker.min = joinDate.toISOString().slice(0, 10);
            startDatePicker.max = new Date().toISOString().slice(0, 10);
            startDatePicker.value = joinDate.toISOString().slice(0, 10);

            endDatePicker.min = joinDate.toISOString().slice(0, 10);
            endDatePicker.max = new Date().toISOString().slice(0, 10);
            endDatePicker.value = new Date().toISOString().slice(0, 10);
            updateStats();
            document.getElementById("stats_screen").classList.remove("hidden");
          });
      });
    })
    .catch((error) => {
      console.log(error.message);
    });
}
getUsers(getCookie("login"), getCookie("password"));

document.getElementById("close_stats_btn").addEventListener("click", () => {
  document.getElementById("stats_screen").classList.add("hidden");

  document.getElementById("last-test_id").innerHTML = "-";
  document.getElementById("last-test_date").innerHTML = "-";
  document.getElementById("last-test_time").innerHTML = "--:--";
  document.getElementById("last-test_score").innerHTML = "-%";

  document.getElementById("best-test_id").innerHTML = "-";
  document.getElementById("best-test_score").innerHTML = "-%";

  document.getElementById("worst-test_id").innerHTML = "-";
  document.getElementById("worst-test_score").innerHTML = "-%";

  document.getElementById("average_score_overall").innerHTML = "100%";
  document.getElementById("total_test_amount").innerHTML = "0";
});

let current_stats_user;
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
function timeAgo(unixTimestamp) {
  const now = Date.now();
  const secondsPast = Math.floor((now - unixTimestamp * 1000) / 1000);

  if (secondsPast < 60) {
    return `${secondsPast} секунд тому`;
  } else if (secondsPast < 3600) {
    const minutes = Math.floor(secondsPast / 60);
    let minutes_text = " хвилин тому";
    if (minutes == 1) {
      minutes_text = " хвилину тому";
    }
    return minutes + minutes_text;
  } else if (secondsPast < 86400) {
    const hours = Math.floor(secondsPast / 3600);
    let hours_text = " годин тому";
    if (hours == 1) {
      hours_text = " годину тому";
    }
    return hours + hours_text;
  } else {
    const days = Math.floor(secondsPast / 86400);
    let day_text = " днів тому";
    if (days == 1) {
      day_text = " день тому";
    }
    return days + day_text;
  }
}
document
  .getElementById("stats-start_date")
  .addEventListener("change", () => updateStats());
document
  .getElementById("stats-end_date")
  .addEventListener("change", () => updateStats());
function updateStats() {
  const startDatePicker = document.getElementById("stats-start_date");
  const endDatePicker = document.getElementById("stats-end_date");
  const completed_tests = current_stats_user.completed_tests.filter((test) => {
    return (
      new Date(test.date * 1000).toISOString().slice(0, 10) >=
        startDatePicker.value &&
      new Date(test.date * 1000).toISOString().slice(0, 10) <=
        endDatePicker.value
    );
  });
  // last test
  let last_test = completed_tests[completed_tests.length - 1];
  document.getElementById("last-test_id").innerHTML = last_test.test;
  document.getElementById("last-test_date").innerHTML = timeAgo(last_test.date);
  document.getElementById("last-test_time").innerHTML = formatTime(
    last_test.time
  );
  document.getElementById("last-test_score").innerHTML =
    Math.floor(last_test.score) + "%";

  const groupedTests = completed_tests.reduce((acc, test) => {
    if (!acc[test.test]) {
      acc[test.test] = [];
    }
    acc[test.test].push(test.score);
    return acc;
  }, {});

  // Step 2: Calculate the average score for each group
  const averageScores = Object.keys(groupedTests).map((test) => {
    const scores = groupedTests[test];
    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return { test, average };
  });

  // Step 3: Determine the best and worst test by average score
  let bestTest = averageScores[0];
  let worstTest = averageScores[0];
  averageScores.forEach((test) => {
    if (test.average > bestTest.average) {
      bestTest = test;
    }
    if (test.average < worstTest.average) {
      worstTest = test;
    }
  });
  let lastBestTest;
  for (let i = completed_tests.length - 1; i >= 0; i--) {
    let ct = completed_tests[i];
    if (ct.test == bestTest.test) {
      lastBestTest = ct;
      break;
    }
  }
  let lastWorstTest;
  for (let i = completed_tests.length - 1; i >= 0; i--) {
    let ct = completed_tests[i];
    if (ct.test == worstTest.test) {
      lastWorstTest = ct;
      break;
    }
  }

  document.getElementById("best-test_id").innerHTML = bestTest.test;
  document.getElementById("best-test_date").innerHTML = timeAgo(
    lastBestTest.date
  );
  document.getElementById("best-test_score").innerHTML =
    Math.floor(bestTest.average) + "%";

  document.getElementById("worst-test_id").innerHTML = worstTest.test;
  document.getElementById("worst-test_date").innerHTML = timeAgo(
    lastWorstTest.date
  );
  document.getElementById("worst-test_score").innerHTML =
    Math.floor(worstTest.average) + "%";

  // Step 4: Calculate the overall average score for all tests
  const totalScores = completed_tests.reduce(
    (sum, test) => sum + test.score,
    0
  );
  const overallAverage = totalScores / completed_tests.length;
  document.getElementById("average_score_overall").innerHTML =
    Math.floor(overallAverage) + "%";

  const total_test_amount = completed_tests.length;
  document.getElementById("total_test_amount").innerHTML = total_test_amount;
}

function requestCode() {
  let auth_key = getCookie("auth_key");
  let course = "history"
  fetch('/api/generateCode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ auth_key, course })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to generate code');
    }
    return response.json();
  })
  .then(data => {
    document.getElementById("code").innerHTML = data.code;
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById("code").innerHTML = 'Error generating code';
  });
}
