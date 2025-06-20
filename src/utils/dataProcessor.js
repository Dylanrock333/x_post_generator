export const processAnalysisData = (data) => {
  if (data && data.claims && Array.isArray(data.claims)) {
    const processedClaims = data.claims.map(claimItem => {
      if (Object.prototype.hasOwnProperty.call(claimItem, 'claim')) {
        const { claim, ...rest } = claimItem;
        return { quote: claim, ...rest };
      }
      return claimItem;
    });
    return { ...data, claims: processedClaims };
  }
  return data;
}; 