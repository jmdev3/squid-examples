import * as dotenv from "dotenv";
import { Squid } from "@0xsquid/sdk";

dotenv.config();

const main = async () => {
  try {
    const sdk = new Squid({
      baseUrl: "https://apiplus.squidrouter.com",
      integratorId: "unergy-sdk",
    });
  } catch (error) {
    console.log(error);
  }
};

main();
