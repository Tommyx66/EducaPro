export const validateRequiredKeys = <T>(data: T, requiredKeys: (keyof T)[]) => {
  requiredKeys.forEach((key) => {
    if (data[key] === undefined || data[key] === null) 
      throw new Error(`${String(key)} is required`);
  });
};

type OmitKeys<T, K extends keyof T> = Omit<T, K>;

export const omitKeys = <T, K extends keyof T>(obj: T, keysToOmit: K[]): OmitKeys<T, K> => {
  const result = { ...obj };

  for (const key of keysToOmit) 
    delete result[key];
  
  return result as OmitKeys<T, K>;
};

export const pickKeys = <T extends object, K extends keyof T>(obj: T, keysToPick: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>;

  for (const key of keysToPick) 
    if (key in obj) 
      result[key] = obj[key];

  return result;
};

export const getSelectKeys = <T extends string>(arrayKeys: T[] = []): Record<T, boolean> => {
  return arrayKeys.reduce((acc: Record<T, boolean>, key: T) => {
    acc[key] = true;
    return acc;
  }, {} as Record<T, boolean>);
};
