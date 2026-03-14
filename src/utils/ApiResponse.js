class ApiResponse {
    constructor(statusCode , deta , message="Success"){
        this.statusCode = statusCode,
        this.deta = data , 
        this.message = message,
        this.success = statusCode <400
    }
}