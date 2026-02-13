import fs from 'fs';

class Database {
    constructor(filepath = './database.json') {
        this.filepath = filepath;
        this.data = {
            users: {},
            groups: {},
            settings: {},
            ...(fs.existsSync(this.filepath) ? JSON.parse(fs.readFileSync(this.filepath)) : {})
        };
    }

    save() {
        fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2));
    }
}

export const database = new Database();
