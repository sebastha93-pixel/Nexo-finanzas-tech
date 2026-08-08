import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { AddContributionDto } from './dto/add-contribution.dto';

@Injectable()
export class GoalsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(g => ({
      ...g,
      progress_percentage: g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0,
      months_to_goal: this.calculateMonthsToGoal(g),
    }));
  }

  async findOne(userId: string, id: string) {
    const { data } = await this.supabase.from('goals').select('*, contributions:goal_contributions(*)').eq('id', id).eq('user_id', userId).single();
    if (!data) throw new NotFoundException('Goal not found');
    return {
      ...data,
      progress_percentage: data.target_amount > 0 ? Math.min((data.current_amount / data.target_amount) * 100, 100) : 0,
      months_to_goal: this.calculateMonthsToGoal(data),
    };
  }

  async create(userId: string, dto: CreateGoalDto) {
    const { data, error } = await this.supabase.from('goals').insert({ ...dto, user_id: userId }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.findOne(userId, id);
    const { data, error } = await this.supabase.from('goals').update(dto).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.supabase.from('goals').delete().eq('id', id).eq('user_id', userId);
    return { message: 'Goal deleted' };
  }

  async addContribution(userId: string, goalId: string, dto: AddContributionDto) {
    const goal = await this.findOne(userId, goalId);

    const { error: insErr } = await this.supabase
      .from('goal_contributions')
      .insert({ ...dto, goal_id: goalId, user_id: userId });
    if (insErr) throw new Error(insErr.message);

    // Recompute current_amount from the authoritative sum of contributions
    // instead of a stale read-modify-write — self-correcting and safe under
    // concurrent contributions (both rows are counted regardless of order).
    const { data: contribs } = await this.supabase
      .from('goal_contributions')
      .select('amount')
      .eq('goal_id', goalId)
      .eq('user_id', userId);
    const total = (contribs ?? []).reduce((s, c) => s + Number(c.amount), 0);

    const patch: Record<string, unknown> = { current_amount: total };
    // Only auto-complete an active goal; never resurrect a paused/cancelled one.
    if (goal.status === 'active' && total >= Number(goal.target_amount)) {
      patch.status = 'completed';
    }

    const { data, error } = await this.supabase
      .from('goals')
      .update(patch)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  private calculateMonthsToGoal(goal: { target_amount: number; current_amount: number; monthly_contribution: number | null }): number | null {
    if (!goal.monthly_contribution || goal.monthly_contribution <= 0) return null;
    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / Number(goal.monthly_contribution));
  }
}
