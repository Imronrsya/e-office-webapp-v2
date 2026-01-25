import axios, { AxiosResponse, AxiosError } from 'axios';
import { env } from './env';

export const api = axios.create({
    baseURL: env.apiUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);
