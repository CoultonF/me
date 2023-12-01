import { useState } from "react";
type TabsType = {
  name: string;
};

const tabs: TabsType[] = [
  { name: "My Account" },
  { name: "Company" },
  { name: "Team Members" },
  { name: "Billing" },
];

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

export const Tabs = () => {
  const [tab, setTab] = useState<string>("Company");
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          defaultValue={
            Array.isArray(tabs)
              ? tabs.find((v) => v.name === tab)?.name
              : "My Account"
          }
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav
          className="isolate flex divide-x divide-gray-200 rounded-lg shadow"
          aria-label="Tabs"
        >
          {tabs.map((tabV, tabIdx) => (
            <button
              type="button"
              onClick={() => setTab(tabV.name)}
              key={tabV.name}
              className={classNames(
                tabV.name === tab
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700",
                tabIdx === 0 ? "rounded-l-lg" : "",
                tabIdx === tabs.length - 1 ? "rounded-r-lg" : "",
                "group relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10"
              )}
              aria-current={tabV.name === tab ? "page" : undefined}
            >
              <span>{tabV.name}</span>
              <span
                aria-hidden="true"
                className={classNames(
                  tabV.name === tab ? "bg-indigo-500" : "bg-transparent",
                  "absolute inset-x-0 bottom-0 h-0.5"
                )}
              />
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
