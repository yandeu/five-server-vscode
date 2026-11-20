import * as assert from "assert";
import { resolveBaseURL } from "../../baseURL";

describe("resolveBaseURL", () => {
  it("returns undefined for an empty setting so the current baseURL is kept", () => {
    assert.strictEqual(resolveBaseURL("", "desktop", 5500), undefined);
    assert.strictEqual(resolveBaseURL(undefined, "desktop", 5500), undefined);
  });

  it("uses a manually set baseURL as is", () => {
    assert.strictEqual(resolveBaseURL("/app/", "desktop", 5500), "/app/");
    assert.strictEqual(resolveBaseURL("/app/", "web", 5500), "/app/");
  });

  it("resolves AUTO to / on desktop", () => {
    assert.strictEqual(resolveBaseURL("AUTO", "desktop", 5500), "/");
  });

  it("resolves AUTO to /proxy/{port}/ on web", () => {
    assert.strictEqual(resolveBaseURL("AUTO", "web", 8080), "/proxy/8080/");
  });

  it("falls back to port 5500 in the proxy path when no port is given", () => {
    assert.strictEqual(resolveBaseURL("AUTO", "web", undefined), "/proxy/5500/");
  });
});
