// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use reqwest;
use reqwest::Client;


#[tauri::command]
async fn fetch_result(roll_number: String, exam_id: String) -> String {
    println!("fetching result of {}", roll_number);
    let client = Client::new();

    let params = [
        ("reg_no", &roll_number),
        ("pro_id", &"1".to_string()),
        ("sess_id", &"20".to_string()),
        ("exam_id", &exam_id),
        ("gdata", &"99".to_string()),
    ];

    let response = client
        .post("https://cmc.du.ac.bd/ajax/get_program_by_exam.php")
        .form(&params)
        .send()
        .await;

    match response {
        Ok(response) => {
            let result_text = response.text().await.unwrap_or_default();
            println!(".... {} ..fetched..", roll_number);
            return result_text;
        }
        Err(_) => String::new(),
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![fetch_result, greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
