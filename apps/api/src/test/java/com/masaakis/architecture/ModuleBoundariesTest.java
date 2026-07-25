package com.masaakis.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

@AnalyzeClasses(packages = "com.masaakis", importOptions = ImportOption.DoNotIncludeTests.class)
class ModuleBoundariesTest {
    @ArchTest
    static final ArchRule domain_does_not_depend_on_api_or_application =
            noClasses().that().resideInAPackage("..domain..")
                    .should().dependOnClassesThat()
                    .resideInAnyPackage("..api..", "..application..");
}

