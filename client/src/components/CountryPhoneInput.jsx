import { useState } from "react";

const countries = [
  { code: "+91", name: "India" },
  { code: "+1", name: "United States / Canada" },
  { code: "+44", name: "United Kingdom" },
  { code: "+977", name: "Nepal" },
  { code: "+880", name: "Bangladesh" },
  { code: "+971", name: "United Arab Emirates" },
  { code: "+61", name: "Australia" },
];

const parsePhone = (value) => {
  const matchingCountry = [...countries]
    .sort((a, b) => b.code.length - a.code.length)
    .find(({ code }) => value?.startsWith(code));
  const country = matchingCountry || countries[0];
  return {
    countryCode: country.code,
    nationalNumber: matchingCountry ? value.slice(country.code.length).replace(/\D/g, "") : "",
  };
};

export default function CountryPhoneInput({ value = "", onChange, disabled = false }) {
  const [phoneParts, setPhoneParts] = useState(() => parsePhone(value));

  const updatePhone = (nextParts) => {
    setPhoneParts(nextParts);
    onChange(`${nextParts.countryCode}${nextParts.nationalNumber}`);
  };

  return (
    <div className="phone-input-row">
      <select
        aria-label="Country calling code"
        value={phoneParts.countryCode}
        disabled={disabled}
        onChange={(event) => updatePhone({ ...phoneParts, countryCode: event.target.value })}
      >
        {countries.map(({ code, name }) => (
          <option key={code} value={code}>{name} ({code})</option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        aria-label="Mobile number"
        placeholder="98765 43210"
        maxLength={14}
        value={phoneParts.nationalNumber}
        disabled={disabled}
        onChange={(event) => updatePhone({
          ...phoneParts,
          nationalNumber: event.target.value.replace(/\D/g, ""),
        })}
      />
    </div>
  );
}
