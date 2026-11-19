export type MarketQuote={id:string;name:string;changeRate:number|null;asOf:string|null;status:'realtime'|'delayed'|'confirmed'|'unavailable';source:string|null};
export const MARKET_INDEXES=[['sp500','S&P 500'],['nasdaq','나스닥 종합'],['dow','다우'],['kospi','코스피'],['kosdaq','코스닥']] as const;
export function emptyMarketQuotes():MarketQuote[]{return MARKET_INDEXES.map(([id,name])=>({id,name,changeRate:null,asOf:null,status:'unavailable',source:null}));}
