import json
import csv
import glob
import os


def convert_to_csv(filename, region, statistic, output):
    OnePerModel = True
    model_run_list = []

    json_file_object = open(filename)
    json_object = json.load(json_file_object)
    json_file_object.close()
    models_list = json_object["RESULTS"].keys()
    season_list = list(json_object['RESULTS']['ACCESS1-0']
                       ['defaultReference']['r1i1p1'][region][statistic].keys())

    for model in sorted(models_list, key=lambda s: s.lower()):
        print("model:", model)
        try:
            runs_list = json_object["RESULTS"][model]["defaultReference"].keys(
            )
            print("runs_list:", runs_list)
            if OnePerModel:
                runs_list = ['r1i1p1']
            for run in sorted(runs_list, key=lambda s: s.lower()):
                print("run:", run)
                try:
                    if OnePerModel:
                        model_run = model
                    else:
                        model_run = '_'.join([model, run])

                    print("model_run:", model_run)
                    if model_run not in model_run_list:
                        model_run_list.append(model_run)
                    if model_run not in output.keys():
                        output[model_run] = {}
                    statistics = json_object['RESULTS'][model]['defaultReference'][run][region].keys(
                    )
                    print('statistics:', statistics)
                    seasons = json_object["RESULTS"][model]["defaultReference"][run][region][statistic]
                    output[model_run] = seasons
                    print("seasons:", seasons)
                    print("model_run_list:", model_run_list)
                    # d2[model_run][mode_season] = tmp / ref
                except Exception as error:
                    print("error:", error)
                    pass
        except Exception as error:
            print("error:", error)
            pass
    # print("models_list:", models_list)
    # print("json_object:", json_object["RESULTS"])
    # print("output:", output)
    # print("season_list:", season_list)
    # print("season_list:", type(season_list))

    headerline = ['model_name'] + season_list

    with open('{}.csv'.format(filename), 'w') as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow(headerline)
        for i, model_run in enumerate(model_run_list):
            print("model_run:", model_run)
            print("model_run data:", output[model_run])
            try:
                csvwriter.writerow(
                    [model_run]
                    + [round(float(output[model_run][season]), 3) for season in season_list])
            except Exception as error:
                print("csv error:", error)
                pass


def main():
    json_files_path = os.path.join(
        os.path.dirname(__file__), '../mean_climate_json_files')

    mean_climate_files = glob.glob("{}/*.json".format(json_files_path))

    region = "global"
    statistic = "rms_xy"

    output = {}
    for climate_file in mean_climate_files:
        convert_to_csv(climate_file, region, statistic, output)


if __name__ == "__main__":
    main()
