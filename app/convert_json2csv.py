import json
import csv

DominantSeasonOnly = False
OnePerModel = True

modes_list = ['NAM', 'NAO', 'SAM', 'PNA', 'PDO']
#modes_list = ['PDO']
stat = 'std_model_pcs'
stat_ref = 'pc1_stdv'

d2 = {}
model_run_list = []
mode_season_list = []

for mode in modes_list:
    filename = 'var_mode_'+mode + \
        '_EOF1_stat_cmip5_historical_mo_atm_1900-2005_adjust_based_tcor_pseudo_vs_model_pcs.json'
    f = open(filename)
    d = json.load(f)

    if DominantSeasonOnly:
        if mode == 'SAM':
            seasons = ['JJA']
        elif mode == 'PDO':
            seasons = ['monthly']
        else:
            seasons = ['DJF']
    else:
        seasons = ['monthly'] if mode == 'PDO' else [
            'DJF', 'MAM', 'JJA', 'SON']

    for season in seasons:

        ref = d["REF"]["obs"]["defaultReference"][mode][season][stat_ref]

        mode_season = '_'.join([mode, season])
        mode_season_list.append(mode_season)

        models_list = d["RESULTS"].keys()
        for model in sorted(models_list, key=lambda s: s.lower()):
            try:
                runs_list = d["RESULTS"][model].keys()
                if OnePerModel:
                    runs_list = ['r1i1p1']
                for run in sorted(runs_list, key=lambda s: s.lower()):
                    # print("run:", run)
                    try:
                        if OnePerModel:
                            model_run = model
                        else:
                            model_run = '_'.join([model, run])
                        if model_run not in model_run_list:
                            model_run_list.append(model_run)
                        if model_run not in d2.keys():
                            d2[model_run] = {}
                        if mode_season not in d2[model_run].keys():
                            d2[model_run][mode_season] = {}
                        tmp = d["RESULTS"][model][run]["defaultReference"][mode][season][stat]
                        d2[model_run][mode_season] = tmp / ref
                    except:
                        pass
            except:
                pass
    print("d2:", d2)

# headerline = ['model_name'] + mode_season_list

# with open('mycsvfile.csv', 'w') as csvfile:
#     csvwriter = csv.writer(csvfile)
#     csvwriter.writerow(headerline)
#     for i, model_run in enumerate(model_run_list):
#         try:
#             csvwriter.writerow(
#                 [model_run]
#                 + [round(d2[model_run][mode_season],3) for mode_season in mode_season_list])
#         except:
#             pass
