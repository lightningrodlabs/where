

/**
 * Object for handling/storing strings in different languages
 */
export class StringStore {

  database: Map<string, Map<string, string>>;
  en: Map<string, string>;
  fr: Map<string, string>;

  constructor(opts?: any) {
    console.warn("Constructing StringStore")
    this.database = new Map<string, Map<string, string>>();
    this.en = new Map<string, string>();
    this.fr = new Map<string, string>();
    this.database.set("en", this.en);
    this.database.set("fr", this.fr);

    this.add("filter", "filtre");

  }


  /**
   *
   */
  add(key: string, fr: string) {
    this.en.set(key, key)
    this.fr.set(key, fr);
  }


  /**
   *
   */
  get(key: string): string {
    const userLang = navigator.language;
    let map = this.database.get(userLang.substr(0, 2));
    if (!map) {
      map = this.en;
    }
    const answer = map!.get(key)
    if (!answer) {
      throw Error(`String "${key}" not found in Stringstore`)
    }
    return answer;
  }

}

export const g_stringStore: StringStore = new StringStore();
