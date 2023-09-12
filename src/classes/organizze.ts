import axios from 'axios';
import {Categorias, Metas} from "../data";

export default class Organizze {
    constructor(private host: string, private userName: string, private password: string) {
    }

    async getCategories() {
        return axios.get<Categorias[]>(`${this.host}/categories`, {
            auth: {
                username: this.userName,
                password: this.password
            }
        }).then(result => result.data);
    }

    async getBudgets() {
        return axios.get<Metas[]>(`${this.host}/budgets`, {
            auth: {
                username: this.userName,
                password: this.password
            }
        }).then(result => result.data);
    }
}