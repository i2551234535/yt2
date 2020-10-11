import axios from "axios";

const testProxy = async (host: string, port: number) => {
  const data = await axios.get("https://www.youtube.com/", {
    // proxy: {
    //   host,
    //   port,
    // },
  });

  console.log(data.data);
};

testProxy("51.81.82.175", 80)
  .then()
  .catch((err) => {
    console.error(err);
  });
