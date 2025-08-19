export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/justride")) {
      const targetUrl = new URL(
        url.pathname.replace("/api/justride", "") + url.search,
        "https://rtddenver.justride.tickets",
      );

      const headers = new Headers(request.headers);
      headers.delete("accept-encoding");
      headers.delete("connection");
      headers.delete("host");
      headers.delete("origin");
      headers.delete("referer");
      headers.delete("sec-fetch-dest");
      headers.delete("sec-fetch-mode");
      headers.delete("sec-fetch-site");
      headers.delete("x-forwarded-host");
      headers.delete("x-mf-sec-fetch-mode");
      headers.set("x-requested-with", "XMLHttpRequest");
      console.log(headers);

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.body,
      });

      // Handle cookie path remapping for JSESSIONID
      if (response.headers.get("set-cookie")) {
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });

        // Rewrite set-cookie headers to change Path=/broker to Path=/api/justride/broker
        const setCookieHeaders = response.headers.getSetCookie();
        if (setCookieHeaders.length > 0) {
          // Remove original set-cookie headers
          newResponse.headers.delete("set-cookie");

          // Add modified set-cookie headers
          setCookieHeaders.forEach((cookieHeader) => {
            const modifiedCookie = cookieHeader.replace(
              "Path=/broker",
              "Path=/api/justride/broker",
            );
            newResponse.headers.append("set-cookie", modifiedCookie);
          });
        }

        return newResponse;
      }

      return response;
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
