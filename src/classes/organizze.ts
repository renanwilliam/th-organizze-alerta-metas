import got from "got";
import {Categorias, Metas} from "../data";

export default class Organizze {
    constructor(private host: string, private userName: string, private password: string) {
    }

    async getCategories() {
        return got.get(`${this.host}/categories`, {
            username: this.userName,
            password: this.password
        }).json<Categorias[]>();
    }

    async getBudgets() {
        return got.get(`${this.host}/budgets`, {
            username: this.userName,
            password: this.password
        }).json<Metas[]>();
    }
}