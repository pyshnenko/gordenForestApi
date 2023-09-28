export interface LoginResData {
    token: String,
    first_name: String,
    last_name: String
}

export interface LoginReqData {
    login: String,
    password: String
}

export interface RegisterReqData { 
    first_name: String,
    last_name: String,
    login: String,
    password: String
}
export interface JoinReqData { 
    id: number,
    token: String,
    nickname: String,
    first_name: String,
    last_name: String,
    futher_name: String,
    phone: Number, 
    email: String,
    birth_date: String,
    vk: String,
    telegram: String,
    about: String
}

export interface User{
    id: Number,
    token: String,
    first_name: String,
    last_name: String,
    login: String,
    role: String
}