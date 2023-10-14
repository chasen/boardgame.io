import { InMemory } from './inmemory';

const getCircularReplacer = () => {
  const ancestors: Array<string> = [];
  return function (key: any, value: any) {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    // `this` is the object that value is contained in,
    // i.e., its direct parent.
    while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(value)) {
      return '[Circular]';
    }
    ancestors.push(value);
    return value;
  };
};

class WithLocalStorageMap<Key, Value> extends Map {
  key: string;

  constructor(key: string) {
    super();
    this.key = key;
    const cache = JSON.parse(localStorage.getItem(this.key)) || [];
    cache.forEach((entry: [Key, Value]) => this.set(...entry));
  }

  sync(): void {
    const entries = [...this.entries()];
    localStorage.setItem(
      this.key,
      JSON.stringify(entries, getCircularReplacer())
    );
  }

  set(key: Key, value: Value): this {
    super.set(key, value);
    this.sync();
    return this;
  }

  delete(key: Key): boolean {
    const result = super.delete(key);
    this.sync();
    return result;
  }
}

/**
 * locaStorage data storage.
 */
export class LocalStorage extends InMemory {
  constructor(storagePrefix = 'bgio') {
    super();
    const StorageMap = (stateKey: string) =>
      new WithLocalStorageMap(`${storagePrefix}_${stateKey}`);
    this.state = StorageMap('state');
    this.initial = StorageMap('initial');
    this.metadata = StorageMap('metadata');
    this.log = StorageMap('log');
  }
}
