#!/bin/sh

for mode in NAM NAO SAM PNA PDO; do
  tgdir="/work/lee1043/cdat/pmp/variability_mode/scripts_consistency_test_b/result_v3.1b_3/analysis/create_EOF_swap_json_chk_model_period_correct_model_name"
  filename="var_mode_"$mode"_EOF1_stat_cmip5_historical_mo_atm_1900-2005_adjust_based_tcor_pseudo_vs_model_pcs.json"
  scp crunchy.llnl.gov:/$tgdir/$filename .
done;
