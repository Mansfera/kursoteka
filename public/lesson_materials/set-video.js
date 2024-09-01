const auth_key = getCookie("auth_key");
const course = params.get("course");
const block = params.get("block");
const tema = params.get("tema");
const scrollTo = params.get("scroll_to");

async function getPlaylist() {
  const url = `/getPlaylist?auth_key=${encodeURIComponent(
    auth_key
  )}&course=${encodeURIComponent(course)}&block=${encodeURIComponent(
    block
  )}&tema=${encodeURIComponent(tema)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }

  return await response.json();
}
getPlaylist().then((data) => {
  if (data) {
    var player = new Playerjs({
      id: "player",
      // autoplay: 1,
      file: data.list,
    });
    fetch("/api/getUserCourses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ auth_key, specific_course: course }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.courses[0]) {
          const info = findBlockAndTest(data.courses[0], block, tema);
          console.log(info);
          if (info) {
            // document.getElementById("block_name").innerHTML = info.block.name;
            document.getElementById("tema_name").innerHTML = info.tema.name;
          }
        }
      });
  } else {
    console.error("Failed to load test data");
  }
});

function findBlockAndTest(courseData, blockId, temaId) {
  const block = courseData.blocks.find((b) => b.id === blockId);

  if (!block) {
    console.log("Block not found");
    return null;
  }

  const tema = block.tests.find((t) => t.id === temaId);

  if (!tema) {
    console.log("Tema not found");
    return null;
  }

  return { block, tema };
}
