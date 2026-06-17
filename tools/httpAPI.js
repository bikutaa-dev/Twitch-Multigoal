const http = require("http")
const httpServerPort = 8623
let httpsCallback = () => {}

/** @param {any[]} args */
const log = (...args) => console.log("[HTTP Server]", ...args)
/** @type {(res: http.ServerResponse, body: any, code?: number) => void} */
const json = (res, body, code = 200) => {
    if(body instanceof Promise) throw new Error("JSON response body was a Promise")
    if(res.headersSent) throw new Error("Headers already sent")
    res.writeHead(code, { "Content-Type": "application/json" })
    res.end(JSON.stringify(body))
}
/** @type {(res: http.ServerResponse, message: string, code: number) => void} */
const jsonError = (res, message, code) => {
    json(res, { success: false, code, message }, code)
}
/**
 * @typedef {(typeof http.IncomingMessage) & { parsedUrl: URL; }} IncomingMessageExtended
 * @typedef {(req: IncomingMessageExtended, res: http.ServerResponse) => any} RouteHandler
 */
const serverRoutes = {
    /** @type {Record<string, Record<string, RouteHandler>>} */
    api: {
        points: {
            add(req, res) {
                let pointsChange = 1
                const pointsInput = req.parsedUrl.searchParams.get("points")
                if(pointsInput) {
                    const value = parseInt(pointsInput, 10)
                    if(!Number.isNaN(value) && isFinite(value)) {
                        pointsChange = Math.max(0, value)
                    }
                } else {
                    log("Could not parse points input:", { pointsInput })
                    jsonError(res, "Could not parse points", 400)
                    return
                }
                try {
                    httpsCallback("points", {action: "add", points: pointsChange})
                    json(res, { success: true })
                } catch(err) {
                    log("Failed to add points:", { pointsChange }, err)
                    jsonError(res, "Failed to add points", 500)
                }
            },
            remove(req, res) {
                let pointsChange = 1
                const pointsInput = req.parsedUrl.searchParams.get("points")
                if(pointsInput) {
                    const value = parseInt(pointsInput, 10)
                    if(!Number.isNaN(value) && isFinite(value)) {
                        pointsChange = Math.max(0, value)
                    }
                } else {
                    log("Could not parse points input:", { pointsInput })
                    jsonError(res, "Could not parse points", 400)
                    return
                }
                try {
                    httpsCallback("points", {action: "remove", points: pointsChange})
                    json(res, { success: true })
                } catch(err) {
                    log("Failed to remove points:", { pointsChange }, err)
                    jsonError(res, "Failed to remove points", 500)
                }
            },
        },
        goals: {
            add(req, res) {
                let goalsChange = 1
                const goalsInput = req.parsedUrl.searchParams.get("goals")
                if(goalsInput) {
                    const value = parseInt(goalsInput, 10)
                    if(!Number.isNaN(value) && isFinite(value)) {
                        goalsChange = Math.max(0, value)
                    }
                } else {
                    log("Could not parse goals input:", { goalsInput })
                    jsonError(res, "Could not parse goals", 400)
                    return
                }
                try {
                    httpsCallback("goals", {action: "add", goals: goalsChange})
                    json(res, { success: true })
                } catch(err) {
                    log("Failed to add goals:", { goalsChange }, err)
                    jsonError(res, "Failed to add goals", 500)
                }
            },
            remove(req, res) {
                let goalsChange = 1
                const goalsInput = req.parsedUrl.searchParams.get("goals")
                if(goalsInput) {
                    const value = parseInt(goalsInput, 10)
                    if(!Number.isNaN(value) && isFinite(value)) {
                        goalsChange = Math.max(0, value)
                    }
                } else {
                    log("Could not parse goals input:", { goalsInput })
                    jsonError(res, "Could not parse goals", 400)
                    return
                }
                try {
                    httpsCallback("goals", {action: "remove", goals: goalsChange})
                    json(res, { success: true })
                } catch(err) {
                    log("Failed to remove goals:", { goalsChange }, err)
                    jsonError(res, "Failed to remove goals", 500)
                }
                },
            reset(req, res) {
                try {
                    httpsCallback("goals", {action: "reset"})
                    json(res, { success: true })
                } catch(err) {
                    log("Failed to reset goal", err)
                    jsonError(res, "Failed to reset goal", 500)
                }
            },
        }
    }
}


function createHTTPServer(port = httpServerPort) {
    
    return http.createServer((incomingReq, res) => {
        const url = new URL(`http://localhost:${port}${incomingReq.url}`)
        const pathParts = url.pathname.replace(/\+/g, "%20")
        .split("/")
        .map(n => decodeURIComponent(n).trim())
        .filter(n => n)
        /** @type {IncomingMessageExtended} */
        // @ts-ignore
        const req = Object.assign(incomingReq, {
        parsedUrl: url
        })
        try {
        /** @type {(Record<string, Record<string, Record<string, RouteHandler>>> | Record<string, Record<string, RouteHandler>> | Record<string, RouteHandler>) | RouteHandler} */
            let routes = serverRoutes
            while(pathParts.length) {
                const part = pathParts.shift()
                if(!part || part in routes === false) {
                    break
                }
                routes = routes[part]
                if(typeof routes === "function") {
                    (/** @type {RouteHandler} */ (routes))(req, res)
                    return
                }
            }
            if(routes && typeof routes === "object" && "index" in routes) {
                // @ts-ignore
                routes.index(req, res)
                return
            }
            jsonError(res, `Not Found: "${url.pathname}"`, 404)
        } catch(err) {
            log(err)
            jsonError(res, "Internal Server Error", 500)
        }
    })
}

function startHTTPAPI(callback, port = httpServerPort) {
    httpsCallback = callback
    const httpServer = createHTTPServer(port)
    if(!httpServer) {
        log("Failed to create HTTP server")
        return
    }
    try {
        httpServer.listen(port, "127.0.0.1", () => {
            log(`http listening on http://127.0.0.1:${port}`)
        })
        httpsCallback = callback
    } catch(err) {
        log("Failed to start HTTP server", err)
    }

    return httpServer
}

module.exports = {
    createHTTPServer,
    startHTTPAPI
}