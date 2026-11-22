import { describe, expect, it } from "vitest";
import { emptyLifeBalance, lifeBalanceStartDate, summarizeLifeBalance, type LifeBalanceSources } from "./life-balance";
const today = "2026-11-22";
const sources = (other: Partial<LifeBalanceSources> = {}): LifeBalanceSources => ({projects:[],todos:[],routines:[],occurrences:[],exercises:[],calendarAreas:[],completions:[],...other});
describe("life balance", () => {
  it("zero without data", () => expect(summarizeLifeBalance(sources(),"7d",today)).toEqual(emptyLifeBalance()));
  it("project TODO inherits the live project category", () => {
    const state=sources({projects:[{id:"p",classification:"career"}],todos:[{id:"t",project_id:"p",life_area:"health",is_completed:true,completed_at:"2026-11-21T12:00:00Z"}]});
    expect(summarizeLifeBalance(state,"7d",today)).toEqual({asset:0,relationship:0,career:1,health:0});
    state.projects[0].classification="asset";
    expect(summarizeLifeBalance(state,"7d",today).asset).toBe(1);
  });
  it("ignores unclassified or pending standalone TODOs", () => {
    const base={project_id:null,is_completed:true,completed_at:"2026-11-21T12:00:00Z"};
    expect(summarizeLifeBalance(sources({todos:[{...base,id:"a",life_area:null},{...base,id:"b",life_area:"relationship",is_completed:false},{...base,id:"c",life_area:"relationship"}]}),"7d",today).relationship).toBe(1);
  });
  it("counts routine and exercise records, not days", () => {
    const state=sources({routines:[{id:"r1",life_area:"health"},{id:"r2",life_area:"asset"}],occurrences:[{routine_id:"r1",occurrence_date:"2026-11-21",status:"completed"},{routine_id:"r2",occurrence_date:"2026-11-21",status:"completed"},{routine_id:"r1",occurrence_date:"2026-11-22",status:"pending"}],exercises:[{id:"e",exercise_date:"2026-11-21"}]});
    expect(summarizeLifeBalance(state,"7d",today)).toEqual({asset:1,relationship:0,career:0,health:2});
  });
  it("requires both calendar category and completion", () => {
    const state=sources({calendarAreas:[{event_id:"g1",event_date:"2026-11-21",life_area:"relationship"},{event_id:"g2",event_date:"2026-11-21",life_area:"health"}],completions:[{source_type:"google",source_id:"g1",completion_date:"2026-11-21"}]});
    expect(summarizeLifeBalance(state,"7d",today).relationship).toBe(1);
    expect(summarizeLifeBalance(state,"7d",today).health).toBe(0);
  });
  it("deduplicates source ID and does not count TODO twice via schedule completion", () => {
    const todo={id:"t",project_id:null,life_area:"career",is_completed:true,completed_at:"2026-11-21T12:00:00Z"};
    const state=sources({todos:[todo,todo],completions:[{source_type:"todo",source_id:"t",completion_date:"2026-11-21"}]});
    expect(summarizeLifeBalance(state,"7d",today).career).toBe(1);
  });
  it("respects local completion date and period start", () => {
    const todo={id:"t",project_id:null,life_area:"health",is_completed:true,completed_at:"2026-11-15T16:00:00Z"};
    expect(summarizeLifeBalance(sources({todos:[todo]}),"7d",today).health).toBe(1);
    expect(summarizeLifeBalance(sources({todos:[todo]}),"7d",today,"UTC").health).toBe(0);
    expect(lifeBalanceStartDate("7d",today)).toBe("2026-11-16");
  });
  it("supports leap-aware periods and full history", () => {
    expect(lifeBalanceStartDate("1m","2026-03-31")).toBe("2026-02-28");
    expect(lifeBalanceStartDate("6m",today)).toBe("2026-05-22");
    expect(lifeBalanceStartDate("1y","2024-02-29")).toBe("2023-02-28");
    expect(lifeBalanceStartDate("all",today)).toBeNull();
  });
  it("does not count future entries", () => {
    expect(summarizeLifeBalance(sources({exercises:[{id:"y",exercise_date:"2026-11-23"}]}),"all",today).health).toBe(0);
  });
});