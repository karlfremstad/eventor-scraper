import {
  Button,
  Card,
  LineChart,
  MultiSelect,
  MultiSelectItem,
  Select,
  SelectItem,
} from "@tremor/react";
import { useEffect, useState } from "react";

import { supabase } from "../../supabaseClient";
import { Spinner } from "../Spinner";

const tiltData = (data, uniquePeriods, uniqueLightConditions) => {
  return uniquePeriods.map((period) => {
    const periodData = { period };

    uniqueLightConditions.forEach((lightConditions) => {
      const item = data.find(
        (item) =>
          item.period === period && item.lightconditions === lightConditions
      );

      periodData[lightConditions || "Day"] = {
        events: item?.total_events || 0,
        starts: item?.total_starts || 0,
      };
    });

    return periodData;
  });
};

export function LightConditionsChart(props) {
  const { filter } = props;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedLightConditions, setSelectedLightConditions] = useState([
    "Night",
    "DayAndNight",
    "Day",
  ]);
  const [dataPoint, setDataPoint] = useState("events");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc("get_events_by_lightcondition", {
      granularity: "year",
      organisation_ids: filter.organisations,
      discipline_list: filter.disciplines,
    });

    if (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      setLoading(false);
    } else {
      setData(
        data.map((item) => ({
          ...item,
          lightconditions: item.lightconditions || "Day",
        }))
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const uniquePeriods = Array.from(
    new Set(data.map((d) => d.period).flat())
  ).sort();

  const uniqueLightConditions = Array.from(
    new Set(data.map((d) => d.lightconditions).flat())
  ).sort();

  useEffect(() => {
    setSelectedLightConditions(uniqueLightConditions);
  }, [data]);

  const chartData = tiltData(data, uniquePeriods, uniqueLightConditions);

  const lookup = {
    events: "Løp",
    starts: "Starter",
  };

  return (
    <Card
      className="flex flex-col content-center justify-center col-span-2"
      decoration="top"
      decorationColor="fuchsia"
    >
      <div className="flex justify-between items-start flex-col  mb-2 gap-2">
        <h3 className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-medium mb-2">
          {lookup[dataPoint]} etter lysforhold
        </h3>

        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <Select
            className="w-64"
            defaultValue="events"
            onValueChange={(value) => setDataPoint(value)}
          >
            <SelectItem value="events">Antall løp</SelectItem>
            <SelectItem value="starts">Antall starter</SelectItem>
          </Select>

          <MultiSelect
            className="w-64"
            defaultValue={["Night", "DayAndNight", "Day"]}
            onValueChange={(e) => setSelectedLightConditions(e)}
          >
            {uniqueLightConditions.map((item) => (
              <MultiSelectItem
                value={item || "Day"}
                key={`lightConditions-${item || "Day"}`}
              >
                {item || "Day"}
              </MultiSelectItem>
            ))}
          </MultiSelect>
        </div>
      </div>

      <div className="flex justify-center items-center h-80">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="flex flex-col items-center">
            <Button onClick={fetchData} className="mt-2">
              Last inn på nytt
            </Button>
          </div>
        ) : (
          <LineChart
            className="h-80"
            data={chartData.map((item) => ({
              period: item.period,
              ...selectedLightConditions
                .map((lightConditions) => ({
                  [lightConditions]: item[lightConditions]?.[dataPoint],
                }))
                .reduce((acc, cur) => ({ ...acc, ...cur }), {}),
            }))}
            index="period"
            autoMinValue={true}
            categories={selectedLightConditions}
            colors={[
              "indigo",
              "rose",
              "lime",
              "fuchsia",
              "teal",
              "yellow",
              "red",
            ]}
            yAxisWidth={60}
            onValueChange={(v) => console.log(v)}
          />
        )}
      </div>
      <p className="text-tremor-content text-xs dark:text-dark-tremor-content mt-5">
        {`Data sammenlignet med samme dato som tidligere år (feks: ${new Date().toLocaleDateString(
          "nb-NO"
        )} sammenlignet med data frem til ${new Date(
          new Date().setFullYear(new Date().getFullYear() - 4)
        ).toLocaleDateString("nb-NO")}).`}
      </p>
    </Card>
  );
}
