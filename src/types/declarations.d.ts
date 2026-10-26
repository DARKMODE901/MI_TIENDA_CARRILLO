// src/types/declarations.d.ts

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.sql' {
  const content: string;
  export default content;
}

declare module '@/drizzle/migrations' {
  const migrations: {
    journal: any;
    migrations: Record<string, string>;
  };
  export default migrations;
}
