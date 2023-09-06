export type IntegrationModel = {
    nomeMeta: string;
    planejado: number;
    gasto: number;
    porcentagem: number;
};

export type Categorias = {
    id: number;
    name: string;
    color: string;
    parent_id: number | null;
    group_id: string;
    fixed: boolean;
    essential: boolean;
    default: boolean;
    uuid: string;
    kind: string;
    archived: boolean;
}


export type Metas = {
    id: number;
    amount_in_cents: number;
    category_id: number;
    date: string;
    activity_type: number;
    total: number;
    predicted_total: number;
    percentage: string;
}
