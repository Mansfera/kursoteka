var block = params.get("block");
var id = params.get("id");
async function checkForPlaylist(block, test) {
  try {
    const response = await fetch(`/getPlaylist?block=${block}&test=${test}`);
    if (!response.ok) {
      throw new Error(`Failed to load test data: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
checkForPlaylist(block, id).then((data) => {
  if (data) {
    var player = new Playerjs({
      id: "player",
      // autoplay: 1,
      file: data.list,
    });
  } else {
    console.error("Failed to load test data");
  }
});
