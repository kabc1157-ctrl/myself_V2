-- V2 payroll compatibility: allow a monthly pay-period start day through day 31.
-- Existing rows and shift records are preserved.
alter table public.workplaces drop constraint if exists workplaces_pay_period_start_day_check;
alter table public.workplaces add constraint workplaces_pay_period_start_day_check check (pay_period_start_day between 1 and 31);
