use axum::{
    extract::Json,
    http::{HeaderValue, Method},
    response::IntoResponse,
    routing::post,
    Router,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tower_http::cors::CorsLayer;

#[derive(Debug, Deserialize)]
struct DisassembleRequest {
    target: String,
    rpc_url: Option<String>,
    decimal_counter: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct CfgRequest {
    target: String,
    rpc_url: Option<String>,
    color_edges: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct DecodeRequest {
    target: String,
    rpc_url: Option<String>,
    skip_resolving: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct DecompileRequest {
    target: String,
    rpc_url: Option<String>,
    include_solidity: Option<bool>,
}

#[derive(Debug, Serialize)]
struct ApiError {
    error: String,
}

async fn disassemble_handler(Json(req): Json<DisassembleRequest>) -> impl IntoResponse {
    use heimdall_disassembler::{disassemble, DisassemblerArgs};

    let args = DisassemblerArgs {
        target: req.target,
        rpc_url: req.rpc_url.unwrap_or_default(),
        decimal_counter: req.decimal_counter.unwrap_or(false),
        name: String::new(),
        output: String::from("print"),
        hardfork: heimdall_disassembler::HardFork::default(),
        etherscan_api_key: String::new(),
    };

    match disassemble(args).await {
        Ok(asm) => Json(json!({ "result": asm })).into_response(),
        Err(e) => {
            let err = ApiError { error: e.to_string() };
            (axum::http::StatusCode::BAD_REQUEST, Json(err)).into_response()
        }
    }
}

async fn cfg_handler(Json(req): Json<CfgRequest>) -> impl IntoResponse {
    use heimdall_cfg::{cfg, CfgArgs};

    let args = CfgArgs {
        target: req.target,
        rpc_url: req.rpc_url.unwrap_or_default(),
        default: true,
        color_edges: req.color_edges.unwrap_or(true),
        output: String::from("print"),
        name: String::new(),
        timeout: 10000,
        hardfork: heimdall_cfg::HardFork::default(),
        etherscan_api_key: String::new(),
    };

    match cfg(args).await {
        Ok(result) => {
            let dot = result.as_dot(true);
            Json(json!({ "dot": dot })).into_response()
        }
        Err(e) => {
            let err = ApiError { error: e.to_string() };
            (axum::http::StatusCode::BAD_REQUEST, Json(err)).into_response()
        }
    }
}

async fn decode_handler(Json(req): Json<DecodeRequest>) -> impl IntoResponse {
    use heimdall_decoder::{decode, DecodeArgs};

    let args = DecodeArgs {
        target: req.target,
        rpc_url: req.rpc_url.unwrap_or_default(),
        openrouter_api_key: String::new(),
        model: String::new(),
        explain: false,
        default: true,
        constructor: false,
        truncate_calldata: false,
        skip_resolving: req.skip_resolving.unwrap_or(false),
        raw: false,
        abi: None,
        output: String::from("print"),
    };

    match decode(args).await {
        Ok(result) => match result.to_json() {
            Ok(json_str) => {
                let parsed: serde_json::Value =
                    serde_json::from_str(&json_str).unwrap_or(json!({}));
                Json(json!({ "result": parsed })).into_response()
            }
            Err(e) => {
                let err = ApiError { error: e.to_string() };
                (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(err)).into_response()
            }
        },
        Err(e) => {
            let err = ApiError { error: e.to_string() };
            (axum::http::StatusCode::BAD_REQUEST, Json(err)).into_response()
        }
    }
}

async fn decompile_handler(Json(req): Json<DecompileRequest>) -> impl IntoResponse {
    use heimdall_decompiler::{decompile, DecompilerArgs};

    let args = DecompilerArgs {
        target: req.target,
        rpc_url: req.rpc_url.unwrap_or_default(),
        default: true,
        skip_resolving: false,
        include_solidity: req.include_solidity.unwrap_or(true),
        include_yul: false,
        name: String::new(),
        output: String::from("print"),
        timeout: 10000,
        abi: None,
        llm_postprocess: false,
        openrouter_api_key: String::new(),
        model: String::new(),
        etherscan_api_key: String::new(),
        hardfork: heimdall_decompiler::HardFork::default(),
    };

    match decompile(args).await {
        Ok(result) => {
            let abi_json = serde_json::to_value(&result.abi).unwrap_or(json!([]));
            Json(json!({
                "source": result.source,
                "abi": abi_json,
            }))
            .into_response()
        }
        Err(e) => {
            let err = ApiError { error: e.to_string() };
            (axum::http::StatusCode::BAD_REQUEST, Json(err)).into_response()
        }
    }
}

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(tower_http::cors::Any);

    let app = Router::new()
        .route("/api/disassemble", post(disassemble_handler))
        .route("/api/cfg", post(cfg_handler))
        .route("/api/decode", post(decode_handler))
        .route("/api/decompile", post(decompile_handler))
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001").await.unwrap();
    println!("Heimdall API server running on http://127.0.0.1:3001");
    axum::serve(listener, app).await.unwrap();
}
